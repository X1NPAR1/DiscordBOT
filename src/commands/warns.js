import { SlashCommandBuilder, MessageFlags, EmbedBuilder } from 'discord.js';
import { loadStore } from '../lib/store.js';

export const data = new SlashCommandBuilder()
  .setName('warns')
  .setDescription('Bir kullanıcının toplam uyarısını gösterir.')
  .addUserOption(o => o.setName('kullanici').setDescription('Hedef').setRequired(true));

export async function execute(interaction) {
  const user = interaction.options.getUser('kullanici', true);
  const db = loadStore();
  const g = db.warnings[interaction.guild.id] ?? {};
  const raw = g[user.id];
  const count = Number.isFinite(raw) ? raw : parseInt(raw ?? '0', 10);
  const safe = Number.isFinite(count) && count >= 0 ? count : 0;

  const emb = new EmbedBuilder()
    .setTitle('📌 Uyarı Bilgisi')
    .setDescription(`**Kullanıcı:** ${user}\n**Toplam Uyarı:** ${safe}`)
    .setColor(0x95A5A6);

  return interaction.reply({ embeds: [emb], flags: MessageFlags.Ephemeral });
}
