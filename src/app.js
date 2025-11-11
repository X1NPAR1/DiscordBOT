// src/app.js
import 'dotenv/config';
import {
  Client, GatewayIntentBits, Partials, Events,
  Collection, EmbedBuilder, ActivityType, MessageFlags,
} from 'discord.js';
import { readdirSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

import { handleButton, handleModal } from './tickets/handlers.js';
import { onVoiceStateUpdate as tempVoiceHandler } from './voice/manager.js';
import { handleRoleButton } from './roles/handler.js';
import { loadStore } from './lib/store.js';

// ⬇️ kalıcı seste kalma helper
import { connectToConfiguredChannel } from './voice/stay.js';

// === PATHS ===
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const commandsDir = path.join(__dirname, 'commands');

// === CLIENT ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();

// === KOMUTLARI YÜKLE (Windows ESM fix) ===
if (existsSync(commandsDir)) {
  const files = readdirSync(commandsDir).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const absPath = path.join(commandsDir, file);
    const fileUrl = pathToFileURL(absPath).href;
    const mod = await import(fileUrl).catch(err => {
      console.error(`❌ import hatası: ${file}`, err);
      return null;
    });
    if (!mod?.data || !mod?.execute) continue;
    client.commands.set(mod.data.name, { data: mod.data, execute: mod.execute });
    console.log(`↪ yüklendi: /${mod.data.name}`);
  }
} else {
  console.warn('⚠ commands/ klasörü bulunamadı; slash komutları yüklenmedi.');
}

// === VOICE EVENTS ===
// 1) Geçici oda sistemi
client.on(Events.VoiceStateUpdate, tempVoiceHandler);

// 2) Botun kendi voice state’i değişirse sağır/mute kal
client.on(Events.VoiceStateUpdate, (oldState, newState) => {
  const me = newState.guild?.members.me || oldState.guild?.members.me;
  if (!me) return;
  if (newState.id !== me.id && oldState.id !== me.id) return;
  try { me.voice.setDeaf(true).catch(() => {}); } catch {}
  try { me.voice.setMute(true).catch(() => {}); } catch {}
});

// === AUTO-ROLE (store > env) ===
client.on(Events.GuildMemberAdd, async (member) => {
  try {
    const db = loadStore();
    const roleId = db?.config?.autoroleId || process.env.AUTOROLE_ID;
    if (!roleId) return;
    const role = member.guild.roles.cache.get(roleId) || await member.guild.roles.fetch(roleId);
    if (role) await member.roles.add(role, 'Autorole');
  } catch (err) {
    console.error('Autorole hata:', err);
  }
});

// === KÜFÜR FİLTRESİ (ayar tabanlı) ===
function containsBadWordBySettings(db, text) {
  const t = (text ?? '').toLowerCase();
  if (!t) return false;
  const sw = db?.config?.swear;
  if (!sw?.enabled) return false;

  const family   = ['ornek1'];
  const religion = ['ornek2'];
  const national = ['ornek3'];

  let bads = [];
  if (sw.family)   bads = bads.concat(family);
  if (sw.religion) bads = bads.concat(religion);
  if (sw.national) bads = bads.concat(national);
  if (Array.isArray(sw.custom)) bads = bads.concat(sw.custom.map(x => (x || '').toLowerCase()));

  return bads.some(w => w && t.includes(w));
}

client.on(Events.MessageCreate, async (msg) => {
  try {
    if (!msg.inGuild() || msg.author.bot) return;

    const db = loadStore();
    if (!containsBadWordBySettings(db, msg.content)) return;

    await msg.delete().catch(() => {});
    const warn = await msg.channel.send({ content: `${msg.author}, lütfen küfür etme.` });
    setTimeout(() => warn.delete().catch(() => {}), 5000);

    const logId = process.env.MODLOG_CHANNEL_ID;
    if (logId) {
      const ch = msg.guild.channels.cache.get(logId);
      if (ch) {
        const emb = new EmbedBuilder()
          .setTitle('🚨 Küfür Filtresi')
          .setDescription(`**Kullanıcı:** ${msg.author}\n**Kanal:** ${msg.channel}\n**İçerik:** ${msg.content}`)
          .setColor(0xE74C3C)
          .setTimestamp();
        ch.send({ embeds: [emb] }).catch(() => {});
      }
    }
  } catch (e) {
    console.error('Filter err:', e);
  }
});

// === SLASH KOMUTLARI / BUTONLAR ===
client.on(Events.InteractionCreate, async (interaction) => {
  if (interaction.isButton()) {
    try { await handleButton(interaction); } catch {}
    try { await handleRoleButton(interaction); } catch {}
    return;
  }

  if (interaction.isModalSubmit()) {
    try { await handleModal(interaction); } catch (e) { console.error(e); }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) {
    return interaction.reply({ content: 'Komut bulunamadı.', flags: MessageFlags.Ephemeral });
  }

  try {
    await cmd.execute(interaction);
  } catch (err) {
    console.error('Komut hatası:', err);
    const payload = { content: 'Bir hata oluştu.', flags: MessageFlags.Ephemeral };
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(payload).catch(() => {});
    } else {
      await interaction.reply(payload).catch(() => {});
    }
  }
});

// === PRESENCE ROTATOR (mor Yayında) ===
function startPresenceRotator(c) {
  const ip   = process.env.SERVER_IP   ?? '185.193.165.88';
  const port = process.env.SERVER_PORT ?? '27015';
  const streamUrl = process.env.STREAM_URL ?? 'https://twitch.tv/twitch';

  const messages = [
    'En iyi CS:GO sunucusu',
    `IP: ${ip} • Port: ${port}`,
    'Sende sunucumuza gel ve tadını çıkar!',
  ];

  let i = 0;
  const apply = () => {
    const name = messages[i % messages.length];
    c.user.setPresence({
      status: 'online',
      activities: [{ name, type: ActivityType.Streaming, url: streamUrl }],
    });
    i++;
  };
  apply();
  setInterval(apply, 30_000);
}

client.once(Events.ClientReady, async (c) => {
  console.log(`✅ Giriş yapıldı: ${c.user.tag}`);
  startPresenceRotator(c);

  // ▶️ Kalıcı ses kanalına bağlan (store veya .env STAY_VOICE_CHANNEL_ID)
  try { await connectToConfiguredChannel(c); } catch {}
});

// === LOGIN ===
if (!process.env.TOKEN) {
  console.error('❌ TOKEN bulunamadı. .env dosyanı kontrol et.');
  process.exit(1);
}
client.login(process.env.TOKEN);
