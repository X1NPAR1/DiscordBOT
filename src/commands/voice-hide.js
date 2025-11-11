import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { isOwnerTextChannel, getOwnedVoiceByTextChannel } from '../voice/manager.js';

export const data = new SlashCommandBuilder().setName('voice-hide').setDescription('Odayı gizle (herkese kapat).');

export async function execute(interaction) {
  if (!isOwnerTextChannel(interaction.guild, interaction.user.id, interaction.channelId))
    return interaction.reply({ content: '❌ Sadece kendi komut-kanalında.', ephemeral: true });
  const vc = getOwnedVoiceByTextChannel(interaction.guild, interaction.user.id, interaction.channelId);
  if (!vc) return interaction.reply({ content: '❌ Oda yok.', ephemeral: true });

  await vc.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: false }).catch(()=>{});
  return interaction.reply({ content: '🙈 Oda gizlendi.', ephemeral: true });
}