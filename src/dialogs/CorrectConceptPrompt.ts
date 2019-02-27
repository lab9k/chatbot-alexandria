import { ConfirmPrompt } from 'botbuilder-dialogs';
import { ConfirmTypes } from '../models/ConfirmTypes';

export default class CorrectConceptPrompt extends ConfirmPrompt {
  public static ID = 'correct_concept_prompt';
  constructor() {
    super(CorrectConceptPrompt.ID);
    this.confirmChoices = [ConfirmTypes.POSITIVE, ConfirmTypes.NEGATIVE];
  }
}
