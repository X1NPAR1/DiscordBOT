import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { giveaways } from '../lib/giveawayStore.js';

export const data = new SlashCommandBuilder()
  .setName('reroll')
  .setDescription('Belirtilen çekilişte yeni bir kazanan seçer.')
  .addStringOption(o => o.setName('mesaj_id').setDescription('Çekiliş mesajının ID’si').setRequired(true))
  .addIntegerOption(o => o.setName('kac_kisi').setDescription('Kaç kişi seçilsin? (varsayılan 1)').setMinValue(1))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  const msgId = interaction.options.getString('mesaj_id', true).trim();
  const count = interaction.options.getInteger('kac_kisi') ?? 1;

  const g = giveaways.get(msgId);
  if (!g) return interaction.reply({ content: '❌ Bu mesaj ID’si için çekiliş kaydı bulunamadı (bot yeniden başlatılmış olabilir).', ephemeral: true });

  const pool = [...g.participants];
  if (pool.length === 0) return interaction.reply({ content: '❌ Katılım yok.', ephemeral: true });

  const winners = [];
  while (winners.length < count && pool.length) {
    const idx = Math.floor(Math.random() * pool.length);
    winners.push(pool.splice(idx, 1)[0]);
  }

  const mentions = winners.map(id => `<@${id}>`).join(', ');
  const emb = new EmbedBuilder()
    .setTitle('🔁 Reroll Sonucu')
    .setDescription(`**Ödül:** ${g.prize}\n**Yeni Kazanan(lar):** ${mentions}`)
    .setColor(0xf1c40f)
    .setTimestamp();

  await interaction.reply({ embeds: [emb] });
}