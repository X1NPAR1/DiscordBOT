import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { isOwnerTextChannel, getOwnedVoiceByTextChannel } from '../voice/manager.js';

export const data = new SlashCommandBuilder()
  .setName('voice-kick')
  .setDescription('Belirtilen kullanıcıyı odadan atar.')
  .addUserOption(o => o.setName('member').setDescription('Atılacak üye').setRequired(true));

export async function execute(interaction) {
  if (!isOwnerTextChannel(interaction.guild, interaction.user.id, interaction.channelId))
    return interaction.reply({ content: '❌ Sadece kendi komut-kanalında.', ephemeral: true });
  const vc = getOwnedVoiceByTextChannel(interaction.guild, interaction.user.id, interaction.channelId);
  if (!vc) return interaction.reply({ content: '❌ Oda yok.', ephemeral: true });

  const user = interaction.options.getUser('member', true);
  const member = await interaction.guild.members.fetch(user.id).catch(()=>null);
  if (!member || member.voice.channelId !== vc.id) {
    return interaction.reply({ content: '❌ Bu kullanıcı odanda değil.', ephemeral: true });
  }
  await member.voice.disconnect('Owner kick').catch(()=>{});
  return interaction.reply({ content: `✅ <@${user.id}> odadan atıldı.`, ephemeral: true });
}
