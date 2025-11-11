import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandsDir = path.join(__dirname, 'commands');

console.log('🔧 commandsDir:', commandsDir, '| exists:', existsSync(commandsDir));

let files = [];
if (existsSync(commandsDir)) {
  files = readdirSync(commandsDir);
}
console.log('📂 files in commandsDir:', files);

const commands = [];
for (const file of files.filter(f => f.endsWith('.js'))) {
  try {
    const absPath = path.join(commandsDir, file);
    const fileUrl = pathToFileURL(absPath).href;
    const mod = await import(fileUrl);
    if (mod?.data) {
      // ÖNEMLİ: DM ve everyone erişimi için default perms NULL olsun
      if (typeof mod.data.setDefaultMemberPermissions === 'function') {
        mod.data.setDefaultMemberPermissions(null);
      }
      if (typeof mod.data.setDMPermission === 'function') {
        // DM’de kullanılabilsin (durum gibi komutlar için good)
        mod.data.setDMPermission(true);
      }
      commands.push(mod.data.toJSON());
      console.log(`✅ eklendi: ${file} -> /${mod.data.name}`);
    } else {
      console.warn(`⚠ atlandı: ${file} (export const data yok)`);
    }
  } catch (e) {
    console.error(`❌ import hatası: ${file}`, e);
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

console.log('🔎 Kontrol →', {
  CLIENT_ID: process.env.CLIENT_ID,
  GUILD_ID: process.env.GUILD_ID,
  count: commands.length
});

try {
  console.log('🔁 Slash komutları kaydediliyor...');
  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands }
  );
  console.log('✅ Komutlar kaydedildi (guild).');
} catch (e) {
  console.error('❌ Komut kayıt hatası:', e?.rawError ?? e);
}
