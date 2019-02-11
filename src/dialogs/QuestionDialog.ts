import { WaterfallDialog, WaterfallStepContext } from 'botbuilder-dialogs';
import { MessageFactory, ActivityTypes, CardFactory } from 'botbuilder';
import CitynetApi from '../api/CitynetApi';
import { FeedbackTypes } from '../models/FeedbackTypes';
import { map } from 'lodash';

export default class QuestionDialog extends WaterfallDialog {
  public static readonly ID = 'question_dialog';
  private readonly api: CitynetApi;
  constructor() {
    super(QuestionDialog.ID);
    this.addStep(this.handleQuestion.bind(this));
    this.addStep(this.handleFeedback.bind(this));
    this.api = new CitynetApi();
  }

  private async handleQuestion(sctx: WaterfallStepContext) {
    // ? Send the documents
    await sctx.context.sendActivity('Please Wait while i get the documents');

    await sctx.context.sendActivity({ type: ActivityTypes.Typing });
    const resolved = await this.api.query(sctx.context.activity.text);

    const cards = map(resolved.documents, (document) => {
      // TODO: map to custom cards
      return CardFactory.adaptiveCard({
        $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
        type: 'AdaptiveCard',
        version: '1.0',
        body: [
          {
            type: 'Container',
            items: [
              {
                type: 'TextBlock',
                text: document.summary,
                size: 'large',
                isSubtle: true,
              },
            ],
          },
          {
            type: 'Container',
            spacing: 'none',
            items: [
              {
                type: 'ColumnSet',
                columns: [
                  {
                    type: 'Column',
                    width: 'stretch',
                    items: [
                      {
                        type: 'TextBlock',
                        text: `Confidence: ${document.scoreInPercent}`,
                        size: 'small',
                        color: 'attention',
                        spacing: 'none',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      });
    });

    await sctx.context.sendActivity(MessageFactory.carousel(cards));

    await this.waitFor(sctx, async () => {
      await sctx.context.sendActivity(
        MessageFactory.suggestedActions(
          [FeedbackTypes.GOOD, FeedbackTypes.BAD],
          'Where these documents usefull?',
        ),
      );
    });
  }
  private async handleFeedback(sctx: WaterfallStepContext) {
    await sctx.context.sendActivity(
      'Thank you for using the bot. If you have more questions, please feel free to ask them here.',
    );
    console.log(`FEEDBACK: ${sctx.context.activity.text}`);
    // TODO: handle feedback
    // TODO: if usefull: thank user and end dialog,
    // TODO: if not useful: send mail, inform the user, exit
    await sctx.endDialog();
  }

  private async waitFor(
    sctx: WaterfallStepContext,
    cb: Function,
  ): Promise<any> {
    await sctx.context.sendActivity({ type: ActivityTypes.Typing });
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(cb());
      },         Math.random() * 1000 + 500);
    });
  }
}
