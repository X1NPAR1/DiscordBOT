import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { getOwnedVoiceByTextChannel, isOwnerTextChannel } from '../voice/manager.js';
import { loadStore, saveStore } from '../lib/store.js';

export const data = new SlashCommandBuilder().setName('voice-claim').setDescription('Boş kalmış odanın sahipliğini üstlen.');

export async function execute(interaction) {
  // claim, sadece sahibin text kanalında anlamlı; basitleştirelim: odası olmayan kullanamaz
  if (isOwnerTextChannel(interaction.guild, interaction.user.id, interaction.channelId)) {
    return interaction.reply({ content: 'ℹ️ Zaten bu odanın sahibisin.', ephemeral: true });
  }
  // bu kanalda kayıtlı bir sahip yoksa (güvenlik için devre dışı bırakılabilir)
  return interaction.reply({ content: '❌ Bu komut burada kullanılamaz.', ephemeral: true });
}
