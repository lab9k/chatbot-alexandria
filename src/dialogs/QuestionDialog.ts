import { WaterfallDialog, WaterfallStepContext } from 'botbuilder-dialogs';
import { MessageFactory, ActivityTypes, CardFactory } from 'botbuilder';
import CitynetApi from '../api/CitynetApi';
import { ResponseTypes } from './ResponseTypes';
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

    const c = MessageFactory.carousel([
      CardFactory.thumbnailCard(resolved, 'short description', [
        'https://cdn.vox-cdn.com/thumbor/AX7FqhqX3IOHrvzzNstp9EwMvEE=' +
          '/0x114:585x559/920x613/filters:focal(248x297:340x389):format(webp)' +
          '/cdn.vox-cdn.com/uploads/chorus_image/image/57272301' +
          '/Screen_Shot_2017_10_23_at_10.16.32_AM.0.png',
      ]),
      CardFactory.thumbnailCard(
        resolved,
        'Lorem ipsum dolor sit amet, ' +
          'consectetur adipiscing elit. Vestibulum ut est eros. Nam' +
          ' ullamcorper malesuada magna, nec semper tellus. Donec vel' +
          ' tristique ante, rhoncus egestas. ',
        [],
        [],
        {
          subtitle: 'subtitle',
        },
      ),
    ]);
    await sctx.context.sendActivity(c);

    await this.waitFor(sctx, async () => {
      await sctx.context.sendActivity(
        MessageFactory.suggestedActions(
          [ResponseTypes.GOOD, ResponseTypes.BAD],
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
