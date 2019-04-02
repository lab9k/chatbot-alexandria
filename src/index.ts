// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

import { config } from 'dotenv';
import * as path from 'path';
import * as restify from 'restify';
import { stringify } from 'flatted';

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
import {
  BotFrameworkAdapter,
  ConversationState,
  MemoryStorage,
  UserState,
} from 'botbuilder';

// Import required bot configuration.
import { BotConfiguration } from 'botframework-config';

import { CityBot } from './bot';

// Read botFilePath and botFileSecret from .env file
// Note: Ensure you have a .env file and include botFilePath and botFileSecret.
const ENV_FILE = path.join(__dirname, '..', '.env');
const loadFromEnv = config({ path: ENV_FILE });

// Get the .bot file path
// See https://aka.ms/about-bot-file to learn more about .bot file its use and bot configuration.
// const BOT_FILE = path.join(__dirname, '..', process.env.botFilePath || '');
// let botConfig: BotConfiguration;
// try {
//   // read bot configuration from .bot file.
//   botConfig = BotConfiguration.loadSync(BOT_FILE, process.env.botFileSecret);
// } catch (err) {
//   console.error(
//     'Error reading bot file. Please ensure you have ' +
//       'valid botFilePath and botFileSecret set for your environment.',
//   );
//   console.error(
//     `The botFileSecret is available under appsettings for your Azure Bot Service bot.`,
//   );
//   console.error(
//     'If you are running this bot locally, consider ' +
//       'adding a .env file with botFilePath and botFileSecret.',
//   );
//   console.error(
//     'See https://aka.ms/about-bot-file to learn more' +
//       ' about .bot file its use and bot configuration.',
//   );
//   process.exit();
// }

// For local development configuration as defined in .bot file.
const DEV_ENVIRONMENT = 'development';

// Define name of the endpoint configuration section from the .bot file.
const BOT_CONFIGURATION = process.env.NODE_ENV || DEV_ENVIRONMENT;
// const BOT_CONFIGURATION = DEV_ENVIRONMENT;
// Get bot endpoint configuration by service name.
// Bot configuration as defined in .bot file.
// const endpointConfig = botConfig.findServiceByNameOrId(
//   BOT_CONFIGURATION,
// ) as IEndpointService;

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about to learn more about bot adapter.
const adapter = new BotFrameworkAdapter({
  appId: process.env.microsoftAppID,
  appPassword: process.env.microsoftAppPassword,
});

// Catch-all for any unhandled errors in your bot.
adapter.onTurnError = async (context, error) => {
  // This check writes out errors to console log .vs. app insights.
  console.error(`\n [onTurnError]: ${error}`);
  console.log(error.stack);
  if (error.message === 'Facebook API error') {
    console.log(JSON.stringify(error['response'].body));
  }
  console.log(stringify(error));
  console.log(error.message);
  console.log(error.name);

  // Send a message to the user.
  await context.sendActivity(`Er ging iets mis! Probeer opnieuw aub`);
  // Clear out state
  await conversationState.delete(context);
};

// Define a state store for your bot.
// See https://aka.ms/about-bot-state to learn more about using MemoryStorage.
// A bot requires a state store to persist the dialog and user state between messages.
let conversationState: ConversationState;

// For local development, in-memory storage is used.
// CAUTION: The Memory Storage used here is for local bot debugging only. When the bot
// is restarted, anything stored in memory will be gone.
const memoryStorage = new MemoryStorage();
conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

// CAUTION: You must ensure your product environment has the NODE_ENV set
//          to use the Azure Blob storage or Azure Cosmos DB providers.
// import { BlobStorage } from 'botbuilder-azure';
// Storage configuration name or ID from .bot file
// const STORAGE_CONFIGURATION_ID = '<STORAGE-NAME-OR-ID-FROM-BOT-FILE>';
// // Default container name
// const DEFAULT_BOT_CONTAINER = '<DEFAULT-CONTAINER>';
// // Get service configuration
// const blobStorageConfig = botConfig.findServiceByNameOrId(STORAGE_CONFIGURATION_ID);
// const blobStorage = new BlobStorage({
//     containerName: (blobStorageConfig.container || DEFAULT_BOT_CONTAINER),
//     storageAccountOrConnectionString: blobStorageConfig.connectionString,
// });
// conversationState = new ConversationState(blobStorage);

// Create the EchoBot.
const bot = new CityBot(conversationState, userState);

// Create HTTP server
const server = restify.createServer();
server.use(restify.plugins.queryParser());

// Listen for incoming activities and route them to your bot for processing.
server.post('/api/messages', (req, res) => {
  adapter.processActivity(req, res, async turnContext => {
    // Call bot.onTurn() to handle all incoming messages.
    await bot.onTurn(turnContext);
  });
});

server.get('/api/messages', (req, res, next) => {
  // Your verify token. Should be a random string.
  const VERIFY_TOKEN = 'test';

  // Parse the query params
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.sendRaw(200, challenge);
      next();
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.status(403);
      next();
    }
  }
});

server.get(
  '/static/*',
  restify.plugins.serveStatic({
    directory: path.resolve(__dirname, '..', 'downloads'),
    appendRequestPath: false,
  }),
);

server.listen(process.env.port || process.env.PORT || 3978, () => {
  console.log(`\n${server.name} listening to ${server.url}`);
  console.log(
    `\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator.`,
  );
  console.log(
    `\nTo talk to your bot, open citybot-alexandria.bot file in the Emulator.`,
  );
  console.log(`ENVIRONMENT:
  BOT_CONFIGURATION: ${BOT_CONFIGURATION}
  `);
});
