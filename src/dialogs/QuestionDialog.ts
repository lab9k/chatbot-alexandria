import {
  WaterfallDialog,
  WaterfallStepContext,
  DialogContext,
  DialogReason,
} from 'botbuilder-dialogs';
import { MessageFactory, ActivityTypes, CardFactory } from 'botbuilder';
import CitynetApi from '../api/CitynetApi';
import { FeedbackTypes } from '../models/FeedbackTypes';
import { map, sortBy } from 'lodash';
import FeedbackPrompt from './FeedbackPrompt';
import lang from '../lang';

import DocumentCard from '../models/DocumentCard';
import { SuggestedActions } from 'botframework-connector/lib/connectorApi/models/mappers';

export default class QuestionDialog extends WaterfallDialog {
  public static readonly ID = 'question_dialog';
  private readonly api: CitynetApi;
  constructor() {
    super(QuestionDialog.ID);
    this.addStep(this.handleQuestion.bind(this));
    this.addStep(this.handleFeedback.bind(this));
    this.addStep(this.handlePersonRequest.bind(this));
    this.api = new CitynetApi();
  }

  private async handleQuestion(sctx: WaterfallStepContext) {
    // ? Send the documents
    await sctx.context.sendActivity(lang.getStringFor(lang.WAIT_WHILE_FETCH));

    await sctx.context.sendActivity({ type: ActivityTypes.Typing });
    const resolved = await this.api.query(sctx.context.activity.text);

    const cards = map(
      sortBy(resolved.documents, 'scoreInPercent').reverse(),
      (document) => {
        const documentCard = new DocumentCard()
          .addTitle()
          .addSummary(document)
          .addConfidenceLevel(document)
          .addAction(document);
        return CardFactory.adaptiveCard(documentCard.card);
      },
    );

    if (cards.length <= 0) {
      await sctx.endDialog();
      return await this.waitFor(sctx, async () => {
        await sctx.context.sendActivity(lang.getStringFor(lang.NO_DOCS_FOUND));
        await sctx.context.sendActivity(lang.getStringFor(lang.MORE_QUESTIONS));
      });
    }
    await sctx.context.sendActivity(MessageFactory.carousel(cards));

    await this.waitFor(sctx, async () => {
      await sctx.prompt(FeedbackPrompt.ID, {
        prompt: lang.getStringFor(lang.USEFULLNESS_QUERY),
        retryPrompt: lang.getStringFor(lang.NOT_UNDERSTOOD_USE_BUTTONS),
      });
    });
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
        suggestedActions: ['Ja', 'Nee'],
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
    if (sctx.context.activity.text.toUpperCase() === 'YES') {
      await sctx.context.sendActivity(lang.getStringFor(lang.EMAIL_SENT));
    } else {
      await sctx.context.sendActivity(lang.getStringFor(lang.MORE_QUESTIONS));
    }
    await sctx.endDialog();
  }

  private async waitFor(sctx: DialogContext, cb: Function): Promise<any> {
    await sctx.context.sendActivity({ type: ActivityTypes.Typing });
    return new Promise((resolve) => {
      // wait 1 to 2 secs for natural feeling
      setTimeout(() => {
        resolve(cb());
      },         Math.random() * 1000 + 1000);
    });
  }
}
