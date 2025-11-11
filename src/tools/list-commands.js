import 'dotenv/config';
import { REST, Routes } from 'discord.js';

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

async function run() {
  console.log('IDs →', { CLIENT_ID: process.env.CLIENT_ID, GUILD_ID: process.env.GUILD_ID });

  const guild = await rest.get(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)).catch(e => ({ error: e.rawError ?? e }));
  const global = await rest.get(Routes.applicationCommands(process.env.CLIENT_ID)).catch(e => ({ error: e.rawError ?? e }));

  console.log('\nGUILD commands:');
  console.dir(guild, { depth: null });

  console.log('\nGLOBAL commands:');
  console.dir(global, { depth: null });
}
run();
