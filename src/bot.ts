import {
  ActivityTypes,
  TurnContext,
  ConversationState,
  UserState,
  StatePropertyAccessor,
} from 'botbuilder';
import { DialogSet, ConfirmPrompt, DialogReason } from 'botbuilder-dialogs';
import QuestionDialog from './dialogs/QuestionDialog';
import FeedbackPrompt from './dialogs/FeedbackPrompt';
import lang from './lang';

const DIALOG_STATE_PROPERTY = 'dialog_state_prop';
export class CityBot {
  private readonly dialogState: StatePropertyAccessor<any>;
  private readonly dialogs: DialogSet;
  private readonly questionDialog: QuestionDialog;

  constructor(
    private conversationState: ConversationState,
    private userState: UserState,
  ) {
    this.dialogState = this.conversationState.createProperty(
      DIALOG_STATE_PROPERTY,
    );
    this.dialogs = new DialogSet(this.dialogState);

    // Add all dialogs
    this.questionDialog = new QuestionDialog();
    [
      this.questionDialog,
      new FeedbackPrompt(),
      new ConfirmPrompt('confirm_prompt'),
    ].forEach((dialog) => {
      this.dialogs.add(dialog);
    });
  }

  async onTurn(turnContext: TurnContext) {
    const options = {
      [ActivityTypes.Message]: async () => {
        await this.handleDialog(turnContext);
      },
      [ActivityTypes.ConversationUpdate]: async () => {
        await this.welcomeUser(turnContext);
      },
    };
    await options[turnContext.activity.type]();
    await this.saveChanges(turnContext);
  }

  private async handleDialog(turnContext: TurnContext) {
    const dialogContext = await this.dialogs.createContext(turnContext);

    // ? continue the multistep dialog that's already begun
    // ? won't do anything if there is no running dialog
    if (dialogContext.context.activity.text) {
      await dialogContext.continueDialog();
    } else if (dialogContext.context.activity.value) {
      await dialogContext.context.sendActivity(
        dialogContext.context.activity.value.content,
      );
      // TODO : fix
      // await this.questionDialog.askFeedback(dialogContext);
      await dialogContext.repromptDialog();
    }

    // ? if no outstanding dialog / no one responded
    if (!dialogContext.context.responded) {
      await dialogContext.beginDialog(QuestionDialog.ID);
    }
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
          await turnContext.sendActivity(lang.getStringFor(lang.WELCOME));
        }
      }
    }
  }
  private async saveChanges(tc: TurnContext) {
    await this.userState.saveChanges(tc);
    await this.conversationState.saveChanges(tc);
  }
}
