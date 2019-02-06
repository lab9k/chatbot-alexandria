// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { ActivityTypes, TurnContext } from 'botbuilder';

export class CityBot {
  async onTurn(turnContext: TurnContext) {
    if (turnContext.activity.type === ActivityTypes.Message) {
      await turnContext.sendActivity(`You said ${turnContext.activity.text}`);
    } else {
      await turnContext.sendActivity(
        `[${turnContext.activity.type} event detected]`,
      );
    }
  }
}
