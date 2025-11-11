import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('unban')
  .setDescription('Bir kullanıcının yasağını kaldırır (ID ile).')
  .addStringOption(o =>
    o.setName('id').setDescription('Kullanıcının Discord ID\'si').setRequired(true)
  )
  .addStringOption(o =>
    o.setName('sebep').setDescription('Sebep (opsiyonel)')
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction) {
  const userId = interaction.options.getString('id', true).trim();
  const reason = interaction.options.getString('sebep') || 'Belirtilmedi';

  try {
    await interaction.guild.bans.remove(userId, reason);

    const emb = new EmbedBuilder()
      .setTitle('Unban İşlemi')
      .addFields(
        { name: 'Kullanıcı ID', value: userId, inline: true },
        { name: 'Yetkili', value: interaction.user.tag, inline: true },
        { name: 'Sebep', value: reason, inline: false },
      )
      .setColor(0x2ECC71)
      .setTimestamp();

    await interaction.reply({ embeds: [emb] });

    const logId = process.env.MODLOG_CHANNEL_ID;
    if (logId) {
      const ch = interaction.guild.channels.cache.get(logId);
      ch?.send({ embeds: [emb] }).catch(() => {});
    }
  } catch (e) {
    return interaction.reply({ content: '❌ Bu ID için aktif ban bulunamadı veya yetkim yetersiz.', ephemeral: true });
  }
}
