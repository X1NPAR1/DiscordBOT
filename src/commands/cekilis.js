// src/commands/cekilis.js
import {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder,
  ButtonStyle, PermissionFlagsBits
} from 'discord.js';
import { giveaways } from '../lib/giveawayStore.js';
import { parseDuration } from '../lib/parseDuration.js';

// ⏱ kalan süreyi formatla
function fmtRemaining(ms) {
  if (ms < 0) ms = 0;
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;

  if (d >= 1) {
    // 1+ gün: gün saat dakika
    return `${d} gün ${h} saat ${m} dk`;
  }
  // < 1 gün: saat dakika saniye (00 pedli)
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return `${h} saat ${mm} dk ${ss} sn`;
}

export const data = new SlashCommandBuilder()
  .setName('cekilis')
  .setDescription('Çekiliş başlatır.')
  .addStringOption(o => o.setName('sure').setDescription('Süre: 10m, 2h, 1d, 1w...').setRequired(true))
  .addStringOption(o => o.setName('odul').setDescription('Ödül').setRequired(true))
  .addIntegerOption(o => o.setName('kazanansayisi').setDescription('Kazanan sayısı').setMinValue(1).setMaxValue(50).setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  const durStr = interaction.options.getString('sure', true);
  const prize = interaction.options.getString('odul', true);
  const winnersCount = interaction.options.getInteger('kazanansayisi', true);

  const ms = parseDuration(durStr);
  if (!ms || ms < 5_000) {
    return interaction.reply({ content: '❌ Süre hatalı. Örn: `10m`, `2h`, `1d`, `1w`', ephemeral: true });
  }

  const endsAt = Date.now() + ms;

  const joinBtn = new ButtonBuilder()
    .setCustomId('gw_join')
    .setLabel('Katıl')
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder().addComponents(joinBtn);

  const startEmb = new EmbedBuilder()
    .setTitle('🎉 Çekiliş Devam Ediyor...')
    .setDescription(
      `**Ödül:** ${prize}\n` +
      `**Kalan Süre:** ${fmtRemaining(ms)}\n` +
      `**Katılanlar:** 0\n\n` +
      `🕐 Çekiliş bitince kazananlar açıklanacak!`
    )
    .setColor(0x9b59b6)
    .setFooter({ text: `Başlatan: ${interaction.user.tag}` })
    .setTimestamp(endsAt);

  const msg = await interaction.reply({ embeds: [startEmb], components: [row], fetchReply: true });

  // kayıt
  giveaways.set(msg.id, {
    prize,
    winners: winnersCount,
    endsAt,
    hostId: interaction.user.id,
    participants: new Set(),
  });

  // ⏳ 15 saniyede bir geri sayım
  const interval = setInterval(async () => {
    const g = giveaways.get(msg.id);
    if (!g) return clearInterval(interval);

    const remaining = g.endsAt - Date.now();
    if (remaining <= 0) {
      clearInterval(interval);
      return; // collector end tetiklenecek
    }

    const updated = new EmbedBuilder()
      .setTitle('🎉 Çekiliş Devam Ediyor...')
      .setDescription(
        `**Ödül:** ${g.prize}\n` +
        `**Kalan Süre:** ${fmtRemaining(remaining)}\n` +
        `**Katılanlar:** ${g.participants.size}\n\n` +
        `🕐 Çekiliş bitince kazananlar açıklanacak!`
      )
      .setColor(0x9b59b6)
      .setFooter({ text: `Başlatan: ${interaction.user.tag}` })
      .setTimestamp(g.endsAt);

    await msg.edit({ embeds: [updated], components: [row] }).catch(() => {});
  }, 15_000);

  // 🎛️ butonlar
  const collector = msg.createMessageComponentCollector({ time: ms });

  collector.on('collect', async i => {
    if (i.customId !== 'gw_join') return;
    if (i.user.bot) return i.deferUpdate();

    const g = giveaways.get(msg.id);
    if (!g) return i.reply({ content: 'Çekiliş kaydı bulunamadı.', ephemeral: true });

    if (g.participants.has(i.user.id)) {
      return i.reply({ content: '❗ Zaten katıldın.', ephemeral: true });
    }
    g.participants.add(i.user.id);
    await i.reply({ content: '✅ Çekilişe katıldın, bol şans!', ephemeral: true });
  });

  collector.on('end', async () => {
    clearInterval(interval);
    const g = giveaways.get(msg.id);
    if (!g) return;

    const pool = [...g.participants];
    if (pool.length === 0) {
      const ended = new EmbedBuilder()
        .setTitle('🎉 Çekiliş Bitti')
        .setDescription(`Katılan olmadı. Ödül: **${g.prize}**`)
        .setColor(0x95a5a6);
      giveaways.delete(msg.id);
      return msg.edit({ embeds: [ended], components: [] }).catch(() => {});
    }

    const winners = [];
    const want = Math.min(g.winners, pool.length);
    while (winners.length < want && pool.length) {
      const idx = Math.floor(Math.random() * pool.length);
      winners.push(pool.splice(idx, 1)[0]);
    }

    const mentions = winners.map(id => `<@${id}>`).join(', ');
    const ended = new EmbedBuilder()
      .setTitle('🎉 Çekiliş Bitti!')
      .setDescription(`**Ödül:** ${g.prize}\n**Kazanan(lar):** ${mentions}`)
      .setColor(0x2ecc71);

    giveaways.delete(msg.id);
    await msg.edit({ embeds: [ended], components: [] }).catch(() => {});
  });
}