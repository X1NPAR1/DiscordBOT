require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const { createHttpServer } = require('./services/httpServer');
const { loadCommands } = require('./services/loader');
const { connectDatabase } = require('./services/database');
const { loadConfig } = require('./services/config');
const path = require('path');

const config = loadConfig();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

client.commands = new Collection();

async function bootstrap() {
  await connectDatabase();
  await loadCommands(client, path.join(__dirname, 'commands'));
  await loadCommands(client, path.join(__dirname, 'features'));

  const eventFiles = require('./services/loader').loadEvents(path.join(__dirname, 'events'));
  for (const { name, execute, once } of eventFiles) {
    if (once) {
      client.once(name, (...args) => execute(client, config, ...args));
    } else {
      client.on(name, (...args) => execute(client, config, ...args));
    }
  }

  createHttpServer(client, config);
  await client.login(process.env.DISCORD_TOKEN);
}

bootstrap().catch((err) => {
  console.error('Bot başlatılamadı:', err);
  process.exit(1);
});
