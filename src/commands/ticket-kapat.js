import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { loadStore } from '../lib/store.js';
import { closeTicketChannel } from '../tickets/handlers.js';
import { isOwnerTextChannel } from '../voice/manager.js';

export const data = new SlashCommandBuilder()
  .setName('ticket-kapat')
  .setDescription('Bulunduğun ticket kanalını kapatır (Close butonuyla aynı).')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction) {
  // özel oda yazı kanalında devre dışı
  if (isOwnerTextChannel(interaction.guild, interaction.user.id, interaction.channelId)) {
    return interaction.reply({
      content: 'Bu komut bu kanalda kullanılamaz. (Özel oda kanallarında sadece `voice-*` komutları çalışır.)',
      flags: MessageFlags.Ephemeral,
    });
  }

  const db = loadStore();
  const cfg = db.config;
  if (!cfg.closedCategoryId) {
    return interaction.reply({
      content: '❌ Kapanan kategori ayarlı değil. Önce `/ticket-setup` yap.',
      flags: MessageFlags.Ephemeral,
    });
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    await closeTicketChannel(interaction.guild, interaction.channel, interaction.user.id);
    await interaction.editReply({ content: '✅ Ticket kapatıldı (kapalı kategoriye taşındı).' });
  } catch (e) {
    await interaction.editReply({ content: '❌ Kapatma sırasında hata oluştu.' });
  }
}
