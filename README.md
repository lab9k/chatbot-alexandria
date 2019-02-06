# Citybot

The bot was created with the [Microsoft Azure Bot Service](https://docs.microsoft.com/en-us/azure/bot-service/?view=azure-bot-service-4.0).

## Prerequisites

* Nodejs v8.5 or higher
```bash
# determine node version:
node --version
```

## Try this bot

* clone the repository
```bash
$ git clone https://github.com/lab9k/chatbot-visit-gent-azure-bot-service.git
```

* navigate to the repository
```bash
$ cd chatbot-visit-gent-azure-bot-service
```

* install modules
```bash
$ npm install
```

* start the server
```bash
# run the server
$ npm start
# run the development server with auto-reloading
$ npm run watch
```

# Testing the bot using Bot Framework Emulator **v4**
[Microsoft Bot Framework Emulator](https://github.com/microsoft/botframework-emulator) is a desktop application that allows bot developers to test and debug their bots on localhost or running remotely through a tunnel.

- Install the Bot Framework emulator from [here](https://github.com/microsoft/botframework-emulator/releases)

## Connect to bot using Bot Framework Emulator **v4**
- Launch Bot Framework Emulator
- File -> Open Bot Configuration
- Select `visit.gent.bot` file
