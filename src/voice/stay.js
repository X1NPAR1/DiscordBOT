// src/voice/stay.js
import {
  joinVoiceChannel,
  getVoiceConnection,
  VoiceConnectionStatus,
  entersState,
} from '@discordjs/voice';

import { loadStore, saveStore } from '../lib/store.js';

function log(...a) { console.log('[stay]', ...a); }

function getTargetChannelId(client) {
  const db = loadStore();
  return db?.config?.stayVoiceChannelId || process.env.STAY_VOICE_CHANNEL_ID || null;
}

/**
 * Güvenli bağlanma: hata fırlatmaz, başarısızsa null döner.
 */
export async function connectToConfiguredChannel(client, { force = false } = {}) {
  const channelId = getTargetChannelId(client);
  if (!channelId) { log('Kanal ID yok, atlıyorum.'); return null; }

  // Zaten aynı kanalda mıyız?
  const existing = getVoiceConnectionForGuild(client, channelId);
  if (existing && !force) return existing;

  // Kanal/guild/adaptör hazırla
  const guild = client.guilds.cache.find(g => g.channels.cache.has(channelId));
  if (!guild) { log('Guild bulunamadı (channelId:', channelId, ')'); return null; }
  const channel = guild.channels.cache.get(channelId);
  if (!channel || channel.type !== 2) { // 2 = GuildVoice
    log('Hedef kanal bir ses kanalı değil veya bulunamadı.');
    return null;
  }

  // Eski bağlantı varsa sonlandır
  try {
    const oldConn = getVoiceConnection(guild.id);
    oldConn?.destroy();
  } catch {}

  let connection;
  try {
    connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: guild.id,
      adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: true,
      selfMute: true,
    });

    // Hata event'lerini yut (proses çökmesin)
    connection.on('error', (err) => {
      console.warn('[stay] Voice connection error:', err?.message || err);
    });

    // READY bekle (maks 15 sn)
    await entersState(connection, VoiceConnectionStatus.Ready, 15_000);
    log('Bağlanıldı:', `${guild.name}#${channel.name}`);

    // Ekstra: mute/deaf garanti
    try {
      await guild.members.me?.voice?.setDeaf(true).catch(() => {});
      await guild.members.me?.voice?.setMute(true).catch(() => {});
    } catch {}

    return connection;
  } catch (err) {
    console.warn('[stay] Bağlanma başarısız:', err?.message || err);
    try { connection?.destroy(); } catch {}
    return null;
  }
}

/**
 * Komutla hedef kanalı değiştir.
 */
export async function switchStayChannel(interaction, newChannelId) {
  const guild = interaction.guild;
  const channel = guild.channels.cache.get(newChannelId);
  if (!channel || channel.type !== 2) {
    return interaction.reply({ content: '❌ Bu bir ses kanalı değil.', ephemeral: true });
  }

  const db = loadStore();
  db.config.stayVoiceChannelId = newChannelId;
  saveStore(db);

  const ok = await connectToConfiguredChannel(interaction.client, { force: true });
  if (!ok) {
    return interaction.reply({
      content: '⚠️ Bağlanma denendi fakat başarısız oldu (izinler/UDP/FW?).',
      ephemeral: true
    });
  }

  return interaction.reply({ content: `✅ Artık **${channel.name}** kanalında kalacağım.`, ephemeral: true });
}

/**
 * Aynı guild’de mevcut bağlantıyı bul.
 */
function getVoiceConnectionForGuild(client, channelId) {
  const guild = client.guilds.cache.find(g => g.channels.cache.has(channelId));
  if (!guild) return null;
  return getVoiceConnection(guild.id) || null;
}
