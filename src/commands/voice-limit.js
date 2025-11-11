import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { isOwnerTextChannel, getOwnedVoiceByTextChannel } from '../voice/manager.js';

export const data = new SlashCommandBuilder()
  .setName('voice-limit')
  .setDescription('Odanın kullanıcı limitini ayarla (0 = sınırsız)')
  .addIntegerOption(o => o.setName('user_limit').setDescription('0-99').setRequired(true).setMinValue(0).setMaxValue(99));

export async function execute(interaction) {
  if (!isOwnerTextChannel(interaction.guild, interaction.user.id, interaction.channelId))
    return interaction.reply({ content: '❌ Sadece kendi komut-kanalında.', ephemeral: true });

  const vc = getOwnedVoiceByTextChannel(interaction.guild, interaction.user.id, interaction.channelId);
  if (!vc) return interaction.reply({ content: '❌ Oda yok.', ephemeral: true });

  const lim = interaction.options.getInteger('user_limit', true);
  await vc.setUserLimit(lim).catch(()=>{});
  return interaction.reply({ content: `✅ Kullanıcı limiti **${lim}** olarak ayarlandı.`, ephemeral: true });
}
