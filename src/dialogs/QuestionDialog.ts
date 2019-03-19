import {
  WaterfallDialog,
  WaterfallStepContext,
  DialogContext,
} from 'botbuilder-dialogs';
import {
  MessageFactory,
  ActivityTypes,
  CardFactory,
  UserState,
  StatePropertyAccessor,
  ActionTypes,
} from 'botbuilder';
import AlexandriaApi from '../api/AlexandriaApi';
import { FeedbackTypes } from '../models/FeedbackTypes';
import { map, sortBy, take } from 'lodash';
import FeedbackPrompt from './FeedbackPrompt';
import lang from '../lang';

import CorrectConceptPrompt from './CorrectConceptPrompt';
import { ConfirmTypes } from '../models/ConfirmTypes';
import { readFileSync } from 'fs';
import { ChannelId } from '../models/ChannelIds';
import { FacebookCardBuilder, FacebookCard } from '../models/FacebookCard';
import nodeFetch from 'node-fetch';
import * as FormData from 'form-data';
import * as path from 'path';
import AlexandriaQueryResponse from '../models/AlexandriaQueryResponse';

export default class QuestionDialog extends WaterfallDialog {
  public static readonly ID = 'question_dialog';
  private readonly api: AlexandriaApi;
  private readonly docsAccessor: StatePropertyAccessor<AlexandriaQueryResponse>;
  constructor(userState: UserState) {
    super(QuestionDialog.ID);
    this.docsAccessor = userState.createProperty<AlexandriaQueryResponse>(
      'resolved_data',
    );
    this.addStep(this.handleQuestion.bind(this));
    this.addStep(this.handleConcept.bind(this));
    this.addStep(this.handleFeedback.bind(this));
    this.addStep(this.handlePersonRequest.bind(this));
    this.api = new AlexandriaApi();
  }

  private async handleQuestion(sctx: WaterfallStepContext) {
    // ? Send the documents
    await sctx.context.sendActivity(lang.getStringFor(lang.WAIT_WHILE_FETCH));

    await sctx.context.sendActivity({ type: ActivityTypes.Typing });
    const resolved: AlexandriaQueryResponse = await this.api.query(
      sctx.context.activity.text,
    );

    // ? break when no documents were found
    if (resolved.results.length <= 0) {
      await sctx.endDialog();
      return await this.waitFor(sctx, async () => {
        await sctx.context.sendActivity(lang.getStringFor(lang.NO_DOCS_FOUND));
        await sctx.context.sendActivity(lang.getStringFor(lang.MORE_QUESTIONS));
      });
    }

    // ? save resolved documents to local storage
    await this.docsAccessor.set(sctx.context, resolved);

    // ? ask if concept is correct
    if (true) {
      console.log('no concepts, skipping question');
      await sctx.next();
      return await this.handleConcept(sctx, true);
    }

    // await this.waitFor(sctx, async () => {
    //   const formatConcepts = (conceptsArray: string[]) =>
    //     conceptsArray
    //       .map(concept =>
    //         concept
    //           .toLowerCase()
    //           .split('_')
    //           .join(' '),
    //       )
    //       .join(', ');
    //   await sctx.prompt(CorrectConceptPrompt.ID, {
    //     prompt: lang
    //       .getStringFor(lang.ASK_CORRECT_CONCEPTS)
    //       .replace('%1%', formatConcepts(resolved.conceptsOfQuery || [])),
    //     retryPrompt: lang.getStringFor(lang.NOT_UNDERSTOOD_USE_BUTTONS),
    //   });
    // });
  }

  private async handleConcept(sctx: WaterfallStepContext, skipped?: boolean) {
    const answer = sctx.context.activity.text;
    if (answer === ConfirmTypes.POSITIVE || skipped) {
      const resolved: AlexandriaQueryResponse = await this.docsAccessor.get(
        sctx.context,
      );
      if (sctx.context.activity.channelId === ChannelId.Facebook) {
        const fbCardBuilder = new FacebookCardBuilder();
        resolved.results.forEach((doc, i) =>
          fbCardBuilder.addCard(
            new FacebookCard(
              `${doc.category.documents[0].meta.title}`,
              `${doc.category.documents[0].meta.description}`,
              {
                type: 'postback',
                title: 'Download pdf //TODO',
                payload: JSON.stringify({
                  content: doc.category.documents[0].filename,
                }),
              },
            ),
          ),
        );
        await sctx.context.sendActivity(fbCardBuilder.getData());
      } else {
        const cards = map(
          sortBy(resolved.results, 'scoreInPercent').reverse(),
          document => {
            return CardFactory.heroCard(
              `${document.category.documents[0].meta.title}`,
              `${document.category.documents[0].meta.description}`,
              [],
              [
                {
                  value: { content: document.category.description },
                  type: ActionTypes.PostBack,
                  title: 'download document //TODO',
                },
              ],
            );
          },
        );
        await sctx.context.sendActivity(MessageFactory.carousel(cards));
      }
      await this.waitFor(sctx, async () => {
        await sctx.prompt(FeedbackPrompt.ID, {
          prompt: lang.getStringFor(lang.USEFULLNESS_QUERY),
          retryPrompt: lang.getStringFor(lang.NOT_UNDERSTOOD_USE_BUTTONS),
        });
      });
    } else if (answer === ConfirmTypes.NEGATIVE) {
      await sctx.context.sendActivity(lang.getStringFor(lang.REPHRASE));
      await sctx.endDialog();
    }
  }

  private async handleFeedback(sctx: WaterfallStepContext) {
    const answer = sctx.context.activity.text;
    if (answer === FeedbackTypes.GOOD) {
      await sctx.context.sendActivity(lang.getStringFor(lang.THANK_FEEDBACK));
      await this.waitFor(sctx, async () => {
        await sctx.context.sendActivity(lang.getStringFor(lang.MORE_QUESTIONS));
      });
      await sctx.endDialog();
    }
    if (answer === FeedbackTypes.BAD) {
      await sctx.prompt('confirm_prompt', {
        prompt: lang.getStringFor(lang.REAL_PERSON),
        retryPrompt: lang.getStringFor(lang.NOT_UNDERSTOOD_USE_BUTTONS),
        choices: [lang.POSITIVE, lang.NEGATIVE],
      });
    }
  }

  public async askFeedback(sctx: DialogContext): Promise<any> {
    await this.waitFor(sctx, async () => {
      await sctx.prompt(FeedbackPrompt.ID, {
        prompt: lang.getStringFor(lang.USEFULLNESS_QUERY),
        retryPrompt: lang.getStringFor(lang.NOT_UNDERSTOOD_USE_BUTTONS),
      });
    });
  }

  private async handlePersonRequest(sctx: WaterfallStepContext) {
    if (
      sctx.context.activity.text.toUpperCase() === lang.POSITIVE.toUpperCase()
    ) {
      await sctx.context.sendActivity(lang.getStringFor(lang.EMAIL_SENT));
    } else {
      await sctx.context.sendActivity(lang.getStringFor(lang.MORE_QUESTIONS));
    }
    await sctx.endDialog();
  }

  public async sendFile(
    dialogContext: DialogContext,
    payload: { content: string },
  ): Promise<any> {
    const resourceUri: string = payload.content;

    console.log('downloading');
    const ret = await this.api.downloadFile(resourceUri);

    const filedata = readFileSync(`./downloads/${ret.filename}`);
    const base64file = Buffer.from(filedata).toString('base64');

    // TODO: split fb and other channels
    if (dialogContext.context.activity.channelId === ChannelId.Facebook) {
      const filePath = path.resolve(
        __dirname,
        '..',
        '..',
        'downloads',
        ret.filename,
      );
      console.log(filePath);
      const fd = new FormData();
      fd.append('file', ret.buffer, {
        filename: ret.filename,
        contentType: ret.contentType,
      });
      return nodeFetch('http://file.io/?expires=1d', {
        method: 'POST',
        body: fd,
      })
        .then(async res => res.json())
        .then(async res => {
          console.log(res);
          await dialogContext.context.sendActivity(
            'Ik stuur je de downloadlink onmiddelijk door.',
          );
          return this.waitFor(dialogContext, async () => {
            return await dialogContext.context.sendActivity(`${res.link}`);
          });
        });
    }
    const reply = {
      type: ActivityTypes.Message,
      attachments: [
        {
          name: ret.filename,
          contentUrl: `data:${ret.contentType};base64,${base64file}`,
          contentType: ret.contentType,
        },
      ],
    };

    return await dialogContext.context.sendActivity(reply);
  }

  private async waitFor(sctx: DialogContext, cb: Function): Promise<any> {
    await sctx.context.sendActivity({ type: ActivityTypes.Typing });
    return new Promise(resolve => {
      // wait 1 to 2 secs for natural feeling
      setTimeout(() => {
        resolve(cb());
      },         Math.random() * 1000 + 1000);
    });
  }
}
