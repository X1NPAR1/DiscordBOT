import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, EmbedBuilder } from 'discord.js';
import { sendModLog } from '../lib/modlog.js';

export const data = new SlashCommandBuilder()
  .setName('timeout')
  .setDescription('Bir üyeyi belirtilen süre (dk) susturur.')
  .addUserOption(o =>
    o.setName('kullanici').setDescription('Susturulacak kullanıcı').setRequired(true)
  )
  .addIntegerOption(o =>
    o.setName('sure').setDescription('Dakika cinsinden süre (1-4320)').setRequired(true)
  )
  .addStringOption(o =>
    o.setName('sebep').setDescription('Sebep (opsiyonel)')
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const user = interaction.options.getUser('kullanici', true);
  const minutes = interaction.options.getInteger('sure', true);
  const reason = interaction.options.getString('sebep') || 'Belirtilmedi';

  if (minutes < 1 || minutes > 4320) {
    return interaction.editReply({ content: '❌ 1 ile 4320 (3 gün) arasında bir süre gir.' });
  }

  const member = await interaction.guild.members.fetch(user.id).catch(() => null);
  if (!member) return interaction.editReply({ content: '❌ Üye bulunamadı.' });

  const ms = minutes * 60 * 1000;

  try {
    await member.timeout(ms, reason);
  } catch {
    return interaction.editReply({ content: '❌ Timeout uygulanamadı (rol sırası/izinleri kontrol et).' });
  }

  const emb = new EmbedBuilder()
    .setTitle('Timeout İşlemi')
    .addFields(
      { name: 'Kullanıcı', value: `${user.tag} (${user.id})`, inline: true },
      { name: 'Süre', value: `${minutes} dk`, inline: true },
      { name: 'Yetkili', value: interaction.user.tag, inline: true },
      { name: 'Sebep', value: reason, inline: false },
    )
    .setColor(0x3498DB)
    .setTimestamp();

  await interaction.editReply({ embeds: [emb] });

  // ModLog + DM
  await sendModLog(interaction.guild, 'timeout', user, interaction.user, reason, {
    duration: `${minutes} dakika`,
  });
}
