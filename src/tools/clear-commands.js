import 'dotenv/config';
import { REST, Routes } from 'discord.js';
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: [] });
console.log('🗑️ Guild komutları temizlendi.');
