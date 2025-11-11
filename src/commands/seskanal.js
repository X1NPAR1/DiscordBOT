// src/commands/seskanal.js
import { SlashCommandBuilder, ChannelType, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { switchStayChannel } from '../voice/stay.js';

export const data = new SlashCommandBuilder()
  .setName('seskanal')
  .setDescription('Botun 7/24 duracağı ses kanalını ayarlar ve hemen bağlanır.')
  .addChannelOption(o =>
    o.setName('kanal')
     .setDescription('Ses kanalı (boş bırakırsan bulunduğun ses kanalı)')
     .addChannelTypes(ChannelType.GuildVoice)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers); // istersen değiştir

export async function execute(interaction) {
  // Kanal seçilmemişse, komutu kullananın bulunduğu ses kanalını dene
  const selected = interaction.options.getChannel('kanal');
  const fallback = interaction.member?.voice?.channel ?? null;
  const voiceCh = selected ?? fallback;

  if (!voiceCh || voiceCh.type !== ChannelType.GuildVoice) {
    return interaction.reply({
      content: '❌ Bir **ses kanalı** seç veya bir ses kanalında bulun.',
      flags: MessageFlags.Ephemeral,
    });
  }

  // switchStayChannel kendisi ephemeral cevap döner (başarı/uyarı)
  await switchStayChannel(interaction, voiceCh.id);
}
