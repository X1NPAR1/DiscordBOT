// src/lib/modlog.js
import { EmbedBuilder } from "discord.js";

const TITLES = {
  ban:     '⛔ Yasaklama',
  unban:   '✅ Yasak Kaldırma',
  kick:    '⏏️ Sunucudan Atma',
  timeout: '⏳ Zaman Aşımı (Timeout)',
  warn:    '⚠️ Uyarı',
  unwarn:  'ℹ️ Uyarı Geri Alındı',
};

const COLORS = {
  ban:     0xE74C3C,
  unban:   0x2ECC71,
  kick:    0xE67E22,
  timeout: 0xF1C40F,
  warn:    0xF39C12,
  unwarn:  0x3498DB,
  default: 0x95A5A6,
};

/**
 * ModLog kanalına log gönderir + kullanıcıya DM bilgilendirmesi yollar.
 *
 * @param {Guild} guild
 * @param {'ban'|'unban'|'kick'|'timeout'|'warn'|'unwarn'} type
 * @param {User|{tag?:string,id?:string}} target
 * @param {User|{tag?:string}} moderator
 * @param {string} reason
 * @param {{duration?:string, oldWarnCount?:number}} extra
 */
export async function sendModLog(guild, type, target, moderator, reason, extra = {}) {
  const channelId = process.env.MODLOG_CHANNEL_ID;
  const logChannel = channelId ? guild.channels.cache.get(channelId) : null;

  const color = COLORS[type] ?? COLORS.default;
  const title = TITLES[type] ?? `🔔 ${String(type).toUpperCase()} İşlemi`;

  // Saat (TR format / HH:MM)
  const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

  // —— SUNUCU LOG EMBED ——
  const logEmb = new EmbedBuilder()
    .setTitle(title)
    .setColor(color)
    .addFields(
      { name: "👤 Kullanıcı", value: `${target?.tag ?? target}`, inline: true },
      { name: "🧑‍⚖️ Yetkili", value: moderator?.tag ?? "Bilinmiyor", inline: true },
      { name: "📝 Sebep",     value: reason || "Belirtilmedi", inline: false },
    )
    .setTimestamp();

  if (extra.duration) {
    logEmb.addFields({ name: "⏳ Süre", value: extra.duration, inline: true });
  }
  if (extra.oldWarnCount !== undefined) {
    logEmb.addFields({ name: "⚠️ Eski Uyarı Sayısı", value: String(extra.oldWarnCount), inline: true });
  }

  if (logChannel) {
    await logChannel.send({ embeds: [logEmb] }).catch(() => {});
  }

  // —— KULLANICI DM EMBED ——
  try {
    const dmDescLines = [
      `**Sunucu:** ${guild.name}`,
      `**İşlem:** ${title.replace(/^[^\s]+\s/, '')}`, // emoji varsa kırp
      `**Yetkili:** ${moderator?.tag ?? "Bilinmiyor"}`,
      `**Sebep:** ${reason || "Belirtilmedi"}`,
    ];
    if (extra.duration) dmDescLines.push(`**Süre:** ${extra.duration}`);
    if (extra.oldWarnCount !== undefined) {
      const yeni = extra.oldWarnCount + (type === 'unwarn' ? -1 : 1);
      dmDescLines.push(`**Uyarı Sayısı:** ${yeni}`);
    }

    const dmEmb = new EmbedBuilder()
      .setTitle(`${title} Bildirimi`)
      .setColor(color)
      .setDescription(dmDescLines.join('\n'))
      .setFooter({ text: `Zenith Yetkili Ekibinden ${moderator?.tag ?? "Bilinmiyor"} – ${nowStr}` })
      .setTimestamp();

    // target bir User nesnesi değilse DM atmaya çalışmayalım
    if (typeof target?.send === 'function') {
      await target.send({ embeds: [dmEmb] }).catch(() => {});
    }
  } catch {
    // DM kapalı olabilir — sessiz geç
  }
}
