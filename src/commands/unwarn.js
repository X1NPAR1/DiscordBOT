import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } from 'discord.js';
import { loadStore, saveStore } from '../lib/store.js';
import { isOwnerTextChannel } from '../voice/manager.js';

export const data = new SlashCommandBuilder()
  .setName('unwarn')
  .setDescription('Kullanıcının uyarı sayısını bir azaltır.')
  .addUserOption(o => o.setName('kullanici').setDescription('Hedef').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction) {
  if (isOwnerTextChannel(interaction.guild, interaction.user.id, interaction.channelId)) {
    return interaction.reply({ content: 'Bu komut burada kullanılamaz.', flags: MessageFlags.Ephemeral });
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const target = interaction.options.getUser('kullanici', true);
  const db = loadStore();
  db.warnings[interaction.guild.id] ??= {};
  const g = db.warnings[interaction.guild.id];

  if (!g[target.id] || g[target.id] <= 0) {
    return interaction.editReply({ content: 'Bu kullanıcının uyarısı yok.' });
  }

  g[target.id] -= 1;
  saveStore(db);

  const emb = new EmbedBuilder()
    .setTitle('✅ Uyarı Düşürüldü')
    .setDescription(`**Kullanıcı:** ${target}\n**Yeni Uyarı Sayısı:** ${g[target.id]}`)
    .setColor(0x2ECC71)
    .setTimestamp();

  await interaction.editReply({ embeds: [emb] });

  const logId = process.env.MODLOG_CHANNEL_ID;
  if (logId) {
    const ch = interaction.guild.channels.cache.get(logId);
    ch?.send({ embeds: [emb] }).catch(() => {});
  }
}
