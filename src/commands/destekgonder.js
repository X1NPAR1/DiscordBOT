import {
  SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  PermissionFlagsBits
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('destekgonder')
  .setDescription('Ticket panosunu kanala gönderir.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  const emb = new EmbedBuilder()
    .setTitle('🎟️ Destek Sistemi')
    .setDescription(
`Sunucumuzla ilgili yardım/şikayet/başvuru için aşağıdaki kategorilerden birini seç.

• Spam yapma, saygılı ol.
• Gereksiz talepler mute/ban sebebi olabilir.
• Açılan ticket 12 saat inaktif kalırsa kapatılır.
• Ban itirazı ve şikayet ticketlarında **kanıt/Steam URL** ekleyin.

Kategori seçtikten sonra formu doldurun ve gönderin.`)
    .setColor(0x5865F2);

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_open_oyuncu').setLabel('🎮 Oyuncu Şikayet').setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('ticket_open_ban').setLabel('🛡️ Ban İtiraz').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('ticket_open_yetkili').setLabel('📝 Yetkili Başvurusu').setStyle(ButtonStyle.Primary),
  );
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket_open_vip').setLabel('💎 VIP Satın Al').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('ticket_open_yonetici').setLabel('👑 Yönetici ile Görüş').setStyle(ButtonStyle.Secondary),
  );

  await interaction.reply({ embeds: [emb], components: [row1, row2] });
}
