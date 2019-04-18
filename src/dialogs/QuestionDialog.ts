import {
  WaterfallDialog,
  WaterfallStepContext,
  DialogContext,
  Choice,
  ChoiceFactory,
} from 'botbuilder-dialogs';
import {
  MessageFactory,
  ActivityTypes,
  CardFactory,
  UserState,
  StatePropertyAccessor,
} from 'botbuilder';
import AlexandriaApi from '../api/AlexandriaApi';
import { FeedbackTypes } from '../models/FeedbackTypes';
import { map } from 'lodash';
import FeedbackPrompt from './FeedbackPrompt';
import lang from '../lang';

import { ConfirmTypes } from '../models/ConfirmTypes';
import { readFileSync } from 'fs';
import { ChannelId } from '../models/ChannelIds';
import { FacebookCardBuilder, FacebookCard } from '../models/FacebookCard';
import nodeFetch from 'node-fetch';
import formData from 'form-data';
import AlexandriaQueryResponse, {
  getDocuments,
} from '../models/AlexandriaQueryResponse';
import CorrectConceptPrompt from './CorrectConceptPrompt';

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
    this.api = new AlexandriaApi();
  }

  private async handleQuestion(sctx: WaterfallStepContext) {
    // ? Send the documents
    await sctx.context.sendActivity(lang.getStringFor(lang.WAIT_WHILE_FETCH));

    await sctx.context.sendActivity({
      type: ActivityTypes.Typing,
    });
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
    const categories = resolved.results.map(r => r.category.description);
    if (categories.length <= 0) {
      console.log('no concepts, skipping question');
      await sctx.next();
      return await this.handleConcept(sctx, true);
    }

    await this.waitFor(sctx, async () => {
      const choices = ChoiceFactory.heroCard(
        categories.map(c => ({ value: c })),
      );
      await sctx.context.sendActivity(
        'Gelieve de juiste categorie te selecteren',
      );
      await sctx.context.sendActivity(choices);
      // await sctx.prompt('choice_prompt', {
      //   choices,
      //   prompt: `Please select the correct category`,
      //   retryPrompt: 'Please use the buttons',
      //   suggestedActions: choices,
      // });
    });
    //  // ? ask if concept is correct
    //  if (!resolved.conceptsOfQuery) {
    //   console.log('no concepts, skipping question');
    //   await sctx.next();
    //   return await this.handleConcept(sctx, true);
    // }

    // await this.waitFor(sctx, async () => {
    //   const formatConcepts = (conceptsArray: string[]) =>
    //     conceptsArray.map(concept => conceptMapping(concept)).join(', ');
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
    const resolved: AlexandriaQueryResponse = await this.docsAccessor.get(
      sctx.context,
    );
    const categories = resolved.results.map(r => r.category.description);
    if (categories.includes(answer) || skipped) {
      const docs = getDocuments(resolved, answer);
      if (sctx.context.activity.channelId === ChannelId.Facebook) {
        const fbCardBuilder = new FacebookCardBuilder();
        docs.forEach((doc, i) =>
          fbCardBuilder.addCard(
            new FacebookCard(`${doc.title}`, `${doc.description}`, {
              type: 'postback',
              title: 'Download pdf',
              payload: JSON.stringify({
                type: 'download',
                value: {
                  uuid: doc.uuid,
                },
              }),
            }),
          ),
        );
        await sctx.context.sendActivity(fbCardBuilder.getData());
      } else {
        const cards = map(docs, document => {
          return CardFactory.heroCard(
            `${document.title}`,
            `${document.description}`,
            [],
            [
              {
                type: 'messageBack',
                title: 'download document',
                value: JSON.stringify({
                  type: 'download',
                  value: {
                    uuid: document.uuid,
                  },
                }),
              },
            ],
          );
        });
        await sctx.context.sendActivity(MessageFactory.carousel(cards));
      }
    } else {
      await sctx.context.sendActivity(lang.getStringFor(lang.REPHRASE));
      await sctx.endDialog();
    }
  }

  public async sendFile(
    dialogContext: DialogContext,
    uuid: string,
  ): Promise<any> {
    console.log('downloading');
    const ret = await this.api.downloadFile(uuid);

    const filedata = readFileSync(`./downloads/${ret.filename}`);
    const base64file = Buffer.from(filedata).toString('base64');

    if (dialogContext.context.activity.channelId === ChannelId.Facebook) {
      const fd = new formData();
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
