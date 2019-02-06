import { WaterfallDialog, WaterfallStepContext } from 'botbuilder-dialogs';
export default class QuestionDialog extends WaterfallDialog {
  public static readonly ID = 'question_dialog';
  constructor() {
    super(QuestionDialog.ID);
    this.addStep(this.handleQuestion.bind(this));
    this.addStep(this.handleQuestion.bind(this));
  }

  private async handleQuestion(sctx: WaterfallStepContext) {}
  private async displayResults(sctx: WaterfallStepContext) {}
}
