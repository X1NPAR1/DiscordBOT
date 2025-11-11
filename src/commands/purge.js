import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} from 'discord.js';
import { isOwnerTextChannel } from '../voice/manager.js';

export const data = new SlashCommandBuilder()
  .setName('purge')
  .setDescription('Bulunduğun kanalda toplu mesaj siler (1-100).')
  .addIntegerOption(o =>
    o.setName('adet')
      .setDescription('Silinecek mesaj sayısı (1-100)')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(interaction) {
  // özel oda yazı kanalında devre dışı
  if (isOwnerTextChannel(interaction.guild, interaction.user.id, interaction.channelId)) {
    return interaction.reply({
      content: 'Bu komut bu kanalda kullanılamaz. (Özel oda kanallarında sadece `voice-*` komutları çalışır.)',
      flags: MessageFlags.Ephemeral,
    });
  }

  // izinler
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return interaction.reply({ content: 'Bu komutu kullanmak için `ManageMessages` izni gerekir.', flags: MessageFlags.Ephemeral });
  }
  if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return interaction.reply({ content: 'Mesaj silebilmem için `ManageMessages` izni vermelisin.', flags: MessageFlags.Ephemeral });
  }

  const amount = interaction.options.getInteger('adet', true);
  if (amount < 1 || amount > 100) {
    return interaction.reply({ content: 'Lütfen **1–100** arası bir sayı gir.', flags: MessageFlags.Ephemeral });
  }

  // 14 günden eski mesajları Discord API zaten silmez; {filterOld: true} benzeri yok,
  // o yüzden "true" paramı sadece başarısız olanları yok sayar.
  const deleted = await interaction.channel.bulkDelete(amount, true).catch(() => null);

  return interaction.reply({
    content: `🧹 ${deleted?.size ?? 0} mesaj silindi.`,
    flags: MessageFlags.Ephemeral,
  });
}
