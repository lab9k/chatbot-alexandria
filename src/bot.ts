// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import {
  ActivityTypes,
  TurnContext,
  ConversationState,
  UserState,
  StatePropertyAccessor,
} from 'botbuilder';
import { DialogSet } from 'botbuilder-dialogs';
import QuestionDialog from './dialogs/QuestionDialog';
const DIALOG_STATE_PROPERTY = 'dialog_state_prop';
export class CityBot {
  private readonly dialogState: StatePropertyAccessor<any>;
  private readonly dialogs: DialogSet;

  constructor(
    private conversationState: ConversationState,
    private userState: UserState,
  ) {
    this.dialogState = this.conversationState.createProperty(
      DIALOG_STATE_PROPERTY,
    );
    this.dialogs = new DialogSet(this.dialogState);

    // Add all dialogs
    [new QuestionDialog()].forEach((dialog) => {
      this.dialogs.add(dialog);
    });
  }

  async onTurn(turnContext: TurnContext) {
    switch (turnContext.activity.type) {
      case ActivityTypes.Message:
        const dialogContext = await this.dialogs.createContext(turnContext);
        if (!dialogContext.context.activity.text.includes('manager')) {
          // Normal flow
          dialogContext.beginDialog(QuestionDialog.ID);
        } else {
          // User would like to talk to the manager
        }
        break;
      case ActivityTypes.ConversationUpdate:
        await this.welcomeUser(turnContext);
        break;
      default:
        break;
    }
    await this.userState.saveChanges(turnContext);
    await this.conversationState.saveChanges(turnContext);
  }

  private async welcomeUser(turnContext: TurnContext) {
    // Do we have any new members added to the conversation?
    if (turnContext.activity.membersAdded.length !== 0) {
      // Iterate over all new members added to the conversation
      for (const idx in turnContext.activity.membersAdded) {
        // Greet anyone that was not the target (recipient) of this message.
        // Since the bot is the recipient for events from the channel,
        // context.activity.membersAdded === context.activity.recipient.Id indicates the
        // bot was added to the conversation, and the opposite indicates this is a user.
        if (
          turnContext.activity.membersAdded[idx].id !==
          turnContext.activity.recipient.id
        ) {
          // Send a "this is what the bot does" message to this user.
          await turnContext.sendActivity(
            `I'm a bot you can ask questions about q-besluit in Ghent,
            ask me any question and i will respond as accurately as possible.`,
          );
        }
      }
    }
  }
}
