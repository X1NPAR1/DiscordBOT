import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} from 'discord.js';
import { sendModLog } from '../lib/modlog.js';

export const data = new SlashCommandBuilder()
  .setName('kick')
  .setDescription('Bir kullanıcıyı sunucudan atar.')
  .addUserOption(o =>
    o.setName('kullanici')
     .setDescription('Kicklenecek kullanıcı')
     .setRequired(true))
  .addStringOption(o =>
    o.setName('sebep')
     .setDescription('Sebep (isteğe bağlı)'))
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

export async function execute(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const targetUser = interaction.options.getUser('kullanici', true);
  const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';
  const guild = interaction.guild;

  const member = await guild.members.fetch(targetUser.id).catch(() => null);
  const me = guild.members.me;

  if (!me) return interaction.editReply({ content: '❌ Bot üye bilgisine ulaşılamadı.' });
  if (!member) return interaction.editReply({ content: '❌ Kullanıcı bu sunucuda bulunamadı.' });
  if (member.id === guild.ownerId) return interaction.editReply({ content: '❌ Sunucu sahibini kickleyemezsin.' });
  if (member.id === me.id) return interaction.editReply({ content: '❌ Kendimi kickleyemem 😅' });
  if (member.id === interaction.user.id) return interaction.editReply({ content: '❌ Kendini kickleyemezsin.' });

  if (!me.permissions.has(PermissionFlagsBits.KickMembers)) {
    return interaction.editReply({ content: '❌ Botun **Kick Members** izni yok.' });
  }

  if (me.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
    return interaction.editReply({ content: '❌ Kick başarısız: Bot rolü, hedefin en yüksek rolünden **aşağıda**.' });
  }
  if (interaction.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 &&
      interaction.user.id !== guild.ownerId) {
    return interaction.editReply({ content: '❌ Kick başarısız: Hedef üye senden **yüksek/eşit** rolde.' });
  }

  try {
    await member.kick(reason);
  } catch (err) {
    console.error(err);
    return interaction.editReply({ content: '❌ Kick sırasında beklenmeyen bir hata oluştu.' });
  }

  await interaction.editReply({ content: `✅ <@${member.id}> kicklendi.` });

  // ModLog + DM
  await sendModLog(guild, 'kick', targetUser, interaction.user, reason);
}
