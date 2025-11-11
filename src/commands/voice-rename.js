import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { isOwnerTextChannel, getOwnedVoiceByTextChannel } from '../voice/manager.js';

export const data = new SlashCommandBuilder()
  .setName('voice-rename')
  .setDescription('Geçici odanın adını değiştirir.')
  .addStringOption(o => o.setName('name').setDescription('Yeni isim').setRequired(true));

export async function execute(interaction) {
  if (!isOwnerTextChannel(interaction.guild, interaction.user.id, interaction.channelId))
    return interaction.reply({ content: '❌ Bu komut kendi komut-kanalında çalışır.', ephemeral: true });
  const vc = getOwnedVoiceByTextChannel(interaction.guild, interaction.user.id, interaction.channelId);
  if (!vc) return interaction.reply({ content: '❌ Oda yok.', ephemeral: true });

  const name = interaction.options.getString('name', true).slice(0, 96);
  await vc.setName(name).catch(()=>{});
  return interaction.reply({ content: `✅ Oda adı **${name}** olarak güncellendi.`, ephemeral: true });
}
