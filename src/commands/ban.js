import { sendModLog } from '../lib/modlog.js';
import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('ban')
  .setDescription('Bir kullanıcıyı sunucudan yasaklar.')
  .addUserOption(o =>
    o.setName('kullanici')
     .setDescription('Banlanacak kullanıcı')
     .setRequired(true))
  .addStringOption(o =>
    o.setName('sebep')
     .setDescription('Sebep (isteğe bağlı)'))
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const targetUser = interaction.options.getUser('kullanici', true);
  const reason = interaction.options.getString('sebep') || 'Sebep belirtilmedi.';
  const guild = interaction.guild;

  const member = await guild.members.fetch(targetUser.id).catch(() => null);
  const me = guild.members.me;

  if (!me) return interaction.editReply({ content: '❌ Bot üye bilgisine ulaşılamadı.' });
  if (member?.id === guild.ownerId) return interaction.editReply({ content: '❌ Sunucu sahibini banlayamazsın.' });
  if (targetUser.id === me.id) return interaction.editReply({ content: '❌ Kendimi banlayamam 😅' });
  if (targetUser.id === interaction.user.id) return interaction.editReply({ content: '❌ Kendini banlayamazsın.' });

  if (!me.permissions.has(PermissionFlagsBits.BanMembers)) {
    return interaction.editReply({ content: '❌ Botun **Ban Members** izni yok.' });
  }

  if (member) {
    if (me.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
      return interaction.editReply({ content: '❌ Ban başarısız: Bot rolü, hedefin en yüksek rolünden **aşağıda**.' });
    }
    if (interaction.member.roles.highest.comparePositionTo(member.roles.highest) <= 0 &&
        interaction.user.id !== guild.ownerId) {
      return interaction.editReply({ content: '❌ Ban başarısız: Hedef üye senden **yüksek/eşit** rolde.' });
    }
  }

  try {
    await guild.members.ban(targetUser.id, { reason });
  } catch (err) {
    console.error(err);
    return interaction.editReply({ content: '❌ Ban sırasında beklenmeyen bir hata oluştu.' });
  }

  await interaction.editReply({ content: `✅ <@${targetUser.id}> banlandı.` });

  // ModLog + DM
  await sendModLog(guild, 'ban', targetUser, interaction.user, reason);
}
