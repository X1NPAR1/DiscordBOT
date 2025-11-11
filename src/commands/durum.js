// src/commands/durum.js
import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { isOwnerTextChannel } from '../voice/manager.js';

export const data = new SlashCommandBuilder()
  .setName('durum')
  .setDescription('CS sunucusunun anlık durumunu gösterir (sadece sana görünür).')
  .setDMPermission(true)            // ✅ DM’de de kullanılabilir
  .setDefaultMemberPermissions(null); // ✅ everyone kullanabilsin

export async function execute(interaction) {
  // Özel oda text kanalında kullanılamasın
  if (interaction.inGuild() && isOwnerTextChannel(interaction.guild, interaction.user.id, interaction.channelId)) {
    return interaction.reply({
      content: 'Bu komut bu kanalda kullanılamaz. (Özel oda kanallarında sadece `voice-*` komutları çalışır.)',
      flags: MessageFlags.Ephemeral,
    });
  }

  // --- GAMEDIG'i yükle (ESM/CJS farklarını güvenli ele al) ---
  let queryFn = null;
  try {
    const mod = await import('gamedig');        // ESM
    const g = mod?.default ?? mod;              // bazı sürümler default ile geliyor
    if (typeof g?.query === 'function') queryFn = g.query.bind(g);
  } catch (_) {}
  if (!queryFn) {
    return interaction.reply({
      content: '❌ `gamedig` yüklenemedi. Sunucuda `npm i gamedig` kurulu mu? (Gerekirse barındırma tarafında da kur)',
      flags: MessageFlags.Ephemeral,
    });
  }

  const host      = process.env.CS_HOST;
  const gamePref  = (process.env.CS_GAME ?? 'cs2').toLowerCase(); // cs2/csgo
  const portGame  = Number(process.env.CS_PORT ?? 27015);
  const portQuery = Number(process.env.CS_QUERY_PORT ?? portGame);
  const friendly  = process.env.CS_NAME || 'CS Sunucusu';

  if (!host) {
    return interaction.reply({ content: '❌ `.env` içinde **CS_HOST** tanımlı değil.', flags: MessageFlags.Ephemeral });
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const types = gamePref === 'csgo' ? ['csgo', 'cs2'] : ['cs2', 'csgo'];
  const ports = [...new Set([portQuery, portGame, portGame + 1, portGame - 1].filter(p => p > 0))];

  let lastErr = null;
  for (const type of types) {
    for (const port of ports) {
      try {
        const state = await queryFn({
          type, host, port,
          maxAttempts: 2,
          socketTimeout: 3000,
          attemptTimeout: 4000,
        });

        const players = (state.players ?? []).map(p => p.name).filter(Boolean);
        const list = players.length ? players.slice(0, 10).join('\n') : '—';
        const online = state.raw?.numplayers ?? state.players?.length ?? 0;
        const max = state.maxplayers ?? state.raw?.maxplayers ?? '?';
        const connect = `steam://connect/${host}:${portGame}`;

        const emb = new EmbedBuilder()
          .setTitle(`📡 ${friendly} Durumu`)
          .setColor(0x2ECC71)
          .addFields(
            { name: 'Sunucu', value: state.name || friendly, inline: false },
            { name: 'IP:Port', value: `${host}:${portGame}`, inline: true },
            { name: 'Query Port', value: `${port}`, inline: true },
            { name: 'Oyun', value: type.toUpperCase(), inline: true },
            { name: 'Harita', value: state.map || '—', inline: true },
            { name: 'Oyuncular', value: `${online}/${max}`, inline: true },
            { name: 'Bağlantı', value: `[Steam ile Bağlan](${connect})`, inline: false },
            { name: 'İlk 10 Oyuncu', value: list, inline: false },
          )
          .setTimestamp();

        return interaction.editReply({ embeds: [emb] });
      } catch (e) {
        lastErr = e;
      }
    }
  }

  const emb = new EmbedBuilder()
    .setTitle(`📡 ${friendly} Durumu`)
    .setDescription('❌ Sunucuya ulaşılamadı. IP/Port veya Query (A2S) engelleniyor olabilir.')
    .setColor(0xE74C3C)
    .addFields(
      { name: 'Denediğimiz Türler', value: types.join(', '), inline: false },
      { name: 'Denediğimiz Portlar', value: ports.join(', '), inline: false },
      { name: 'Son Hata', value: '```' + (lastErr?.message || 'bilinmiyor') + '```', inline: false },
    )
    .setTimestamp();

  await interaction.editReply({ embeds: [emb] });
}
