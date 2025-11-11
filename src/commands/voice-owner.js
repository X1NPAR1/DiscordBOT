import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { isOwnerTextChannel, getOwnedVoiceByTextChannel } from '../voice/manager.js';

export const data = new SlashCommandBuilder()
  .setName('voice-owner')
  .setDescription('Geçici odanın sahibini gösterir.');

export async function execute(interaction) {
  const ok = isOwnerTextChannel(interaction.guild, interaction.user.id, interaction.channelId);
  if (!ok) return interaction.reply({ content: '❌ Bu komut sadece **kendi komut-kanalında** kullanılabilir.', ephemeral: true });
  const vc = getOwnedVoiceByTextChannel(interaction.guild, interaction.user.id, interaction.channelId);
  if (!vc) return interaction.reply({ content: '❌ Odan bulunamadı.', ephemeral: true });
  return interaction.reply({ content: `👑 Oda sahibi: <@${interaction.user.id}> | Ses kanalı: <#${vc.id}>`, ephemeral: true });
}
