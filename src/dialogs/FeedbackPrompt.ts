import { ConfirmPrompt } from 'botbuilder-dialogs';
import { FeedbackTypes } from '../models/FeedbackTypes';

export default class FeedbackPrompt extends ConfirmPrompt {
  public static ID = 'feedback_prompt';
  constructor() {
    super(FeedbackPrompt.ID);
    this.confirmChoices = [FeedbackTypes.BAD, FeedbackTypes.GOOD];
  }
}
