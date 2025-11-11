import {
  ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder,
  EmbedBuilder, ButtonBuilder, ButtonStyle, MessageFlags
} from 'discord.js';
import { loadStore, saveStore } from '../lib/store.js';

function canOpen(type, userId, db) {
  const map = db.active[type] ?? {};
  return !map[userId];
}
function registerActive(type, userId, channelId) {
  const db = loadStore();
  if (!db.active[type]) db.active[type] = {};
  db.active[type][userId] = channelId;
  saveStore(db);
}
function unregisterActiveByChannel(channelId) {
  const db = loadStore();
  for (const type of Object.keys(db.active)) {
    for (const uid of Object.keys(db.active[type])) {
      if (db.active[type][uid] === channelId) delete db.active[type][uid];
    }
  }
  saveStore(db);
}
function nextName() {
  const db = loadStore(); const n = db.nextNumber++; saveStore(db);
  return `destek-${n}`;
}

// ————— Yetki yardımcıları —————
function canClose(i, openerId, cfg) {
  const isStaff = cfg.staffRoleId && i.member.roles.cache.has(cfg.staffRoleId);
  const isAdmin = cfg.adminRoleId && i.member.roles.cache.has(cfg.adminRoleId);
  const hasCloseRole = cfg.closeRoleId && i.member.roles.cache.has(cfg.closeRoleId);
  // opener artık kapatamaz
  return isStaff || isAdmin || hasCloseRole;
}
function canDelete(i, cfg) {
  const isStaff = cfg.staffRoleId && i.member.roles.cache.has(cfg.staffRoleId);
  const isAdmin = cfg.adminRoleId && i.member.roles.cache.has(cfg.adminRoleId);
  const hasDeleteRole = cfg.deleteRoleId && i.member.roles.cache.has(cfg.deleteRoleId);
  return isAdmin || hasDeleteRole || isStaff;
}

// ————— Kanal oluşturma + açılış mesajı —————
async function createTicketChannel(guild, opener, type) {
  const db = loadStore(); const cfg = db.config;
  if (!cfg.openCategoryId || !cfg.staffRoleId) throw new Error('Ticket ayarları eksik');

  const name = nextName();

  // Oyuncular bot mesajını SİLEMEZ
  const overwrites = [
    { id: guild.roles.everyone, deny: ['ViewChannel', 'ManageMessages'] },
    { id: opener.id, allow: ['ViewChannel','SendMessages','AttachFiles','EmbedLinks'], deny: ['ManageMessages'] },
    { id: cfg.staffRoleId, allow: ['ViewChannel','SendMessages','AttachFiles','EmbedLinks','ManageMessages'] },
    ...(cfg.adminRoleId ? [{ id: cfg.adminRoleId, allow: ['ViewChannel','SendMessages','AttachFiles','EmbedLinks','ManageMessages','ManageChannels'] }] : []),
  ];

  const ch = await guild.channels.create({
    name, type: 0, parent: cfg.openCategoryId, permissionOverwrites: overwrites,
    topic: `Type:${type} | Opener:${opener.id}`
  });

  // “Ticketi Kapat” butonu
  const closeBtn = new ButtonBuilder()
    .setCustomId('ticket_close')
    .setLabel('Ticketi Kapat')
    .setEmoji('🔒')
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder().addComponents(closeBtn);

  // Detaylı bilgilendirme EMBED'i
  const info = new EmbedBuilder()
    .setTitle('🎟️ Destek Talebi Açıldı')
    .setColor(0x5865F2)
    .setDescription(
`> Merhaba <@${opener.id}>! Talebin başarıyla oluşturuldu. Ekibimiz en kısa sürede seninle ilgilenecek.

**Kurallar**
• Spam, flood ve yetkili etiketlemek yasaktır.  
• Konu dışı mesajlar ve gereksiz talepler cezaya sebep olabilir.  
• Kanıt eklemen gerekiyorsa **video/ss/URL** paylaş.  
• Bu ticket 12 saat içindeki son mesajdan sonra **otomatik kapatılabilir**.  

**İpuçları**
• **Ban İtirazı**: Steam URL, yasaklayan yetkili, tarih ve kısa savunma.  
• **Oyuncu Şikayeti**: Steam URL, “yeni hesap mı?” ve olayın özeti.  
• **VIP / Başvuru**: Gerekli bilgileri düzenli yaz.  

Kapatmak istersen aşağıdaki **Ticketi Kapat** düğmesini kullan.`)
    .setFooter({ text: `Kanal: ${name}` })
    .setTimestamp();

  // Embed + tek @everyone (rol mention YOK)
  await ch.send({
    embeds: [info],
    content: '@everyone',
    components: [row],
    allowedMentions: { parse: ['everyone'], users: [opener.id], roles: [] }
  });

  registerActive(type, opener.id, ch.id);
  return ch;
}

// ————— Ticket kapatma: kapalı kategori + Sil butonu —————
async function closeTicketChannel(guild, channel, closedByUserId) {
  const db = loadStore(); const cfg = db.config;
  if (!cfg.closedCategoryId) throw new Error('Kapanan kategori ayarlı değil');

  const openerMatch = channel.topic?.match(/Opener:(\d{17,20})/);
  const openerId = openerMatch?.[1];

  const overwrites = [
    { id: guild.roles.everyone, deny: ['ViewChannel', 'ManageMessages'] },
    ...(openerId ? [{ id: openerId, deny: ['ViewChannel','SendMessages','ManageMessages'] }] : []),
    { id: cfg.staffRoleId, allow: ['ViewChannel','SendMessages','AttachFiles','EmbedLinks','ManageMessages'] },
    ...(cfg.adminRoleId ? [{ id: cfg.adminRoleId, allow: ['ViewChannel','SendMessages','AttachFiles','EmbedLinks','ManageMessages','ManageChannels'] }] : []),
  ];
  await channel.edit({ parent: cfg.closedCategoryId, permissionOverwrites: overwrites }).catch(() => {});
  unregisterActiveByChannel(channel.id);

  // Sil butonu
  const delBtn = new ButtonBuilder()
    .setCustomId('ticket_delete')
    .setLabel('Sil')
    .setEmoji('🗑️')
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder().addComponents(delBtn);

  const emb = new EmbedBuilder()
    .setTitle('🔒 Ticket Kapatıldı')
    .setDescription(`Bu ticket kapatıldı ve yalnızca yönetim tarafından görülebilir.\nKapatan: <@${closedByUserId}>`)
    .setColor(0x95a5a6)
    .setTimestamp();

  await channel.send({ embeds: [emb], components: [row], allowedMentions: { parse: [] } }).catch(() => {});
}

// ————— Interaction router —————
export async function handleButton(i) {
  const db = loadStore(); const cfg = db.config;

  // kapat
  if (i.customId === 'ticket_close') {
    const openerMatch = i.channel.topic?.match(/Opener:(\d{17,20})/);
    const openerId = openerMatch?.[1];
    if (!canClose(i, openerId, cfg)) {
      return i.reply({ content: '❌ Bu ticketı kapatma yetkin yok.', flags: MessageFlags.Ephemeral });
    }
    await i.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      await closeTicketChannel(i.guild, i.channel, i.user.id);
      return i.editReply({ content: '✅ Ticket kapatıldı (kapalı kategoriye taşındı).' });
    } catch {
      return i.editReply({ content: '❌ Kapatma sırasında hata. `/ticket-setup` ayarlarını kontrol et.' });
    }
  }

  // sil
  if (i.customId === 'ticket_delete') {
    if (!canDelete(i, cfg)) {
      return i.reply({ content: '❌ Bu ticketı silme yetkin yok.', flags: MessageFlags.Ephemeral });
    }
    await i.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      await i.channel.delete('Ticket silindi');
      return; // silindi
    } catch {
      return i.editReply({ content: '❌ Kanal silinemedi.' });
    }
  }

  // açma butonları
  const typeMap = {
    'ticket_open_oyuncu': 'oyuncu-sikayet',
    'ticket_open_ban': 'ban-itiraz',
    'ticket_open_yetkili': 'yetkili-basvuru',
    'ticket_open_vip': 'vip',
    'ticket_open_yonetici': 'yonetici-gorus',
  };
  const t = typeMap[i.customId];
  if (!t) return;

  if (!canOpen(t, i.user.id, db)) {
    return i.reply({ content: '❗ Bu kategoride zaten açık bir ticketın var.', flags: MessageFlags.Ephemeral });
  }

  // modal gerekenler
  if (t === 'ban-itiraz') {
    const modal = new ModalBuilder().setCustomId('modal_ban').setTitle('Ban İtiraz Formu');
    const steam = new TextInputBuilder().setCustomId('steam').setLabel('Steam Profil URL').setStyle(TextInputStyle.Short).setRequired(true);
    const yetkili = new TextInputBuilder().setCustomId('yetkili').setLabel('Yasaklayan Yetkili').setStyle(TextInputStyle.Short).setRequired(true);
    const tarih = new TextInputBuilder().setCustomId('tarih').setLabel('Yasaklanma Tarihi (GG-AA-YYYY)').setStyle(TextInputStyle.Short).setRequired(true);
    const savunma = new TextInputBuilder().setCustomId('savunma').setLabel('Savunmanız').setStyle(TextInputStyle.Paragraph).setRequired(true);
    modal.addComponents(
      new ActionRowBuilder().addComponents(steam),
      new ActionRowBuilder().addComponents(yetkili),
      new ActionRowBuilder().addComponents(tarih),
      new ActionRowBuilder().addComponents(savunma),
    );
    return i.showModal(modal);
  }

  if (t === 'oyuncu-sikayet') {
    const modal = new ModalBuilder().setCustomId('modal_sikayet').setTitle('Oyuncu Şikayet Formu');
    const steam = new TextInputBuilder().setCustomId('steam').setLabel('Şüpheli Steam Profil URL').setStyle(TextInputStyle.Short).setRequired(true);
    const yeni = new TextInputBuilder().setCustomId('yeni').setLabel('Yeni Hesap mı? (evet/hayır)').setStyle(TextInputStyle.Short).setRequired(true);
    const sebep = new TextInputBuilder().setCustomId('sebep').setLabel('Şikayet Sebebi').setStyle(TextInputStyle.Paragraph).setRequired(true);
    modal.addComponents(
      new ActionRowBuilder().addComponents(steam),
      new ActionRowBuilder().addComponents(yeni),
      new ActionRowBuilder().addComponents(sebep),
    );
    return i.showModal(modal);
  }

  // diğerleri: direkt kanal
  const ch = await createTicketChannel(i.guild, i.user, t);
  return i.reply({ content: `✅ Ticket açıldı: <#${ch.id}>`, flags: MessageFlags.Ephemeral });
}

export async function handleModal(i) {
  // modal sonrası; kullanıcılar bot mesajını silemez (izinler yukarıda)
  if (i.customId === 'modal_ban') {
    const ch = await createTicketChannel(i.guild, i.user, 'ban-itiraz');
    const emb = new EmbedBuilder()
      .setTitle('🛡️ Ban İtirazı')
      .setColor(0x2c3e50)
      .setDescription(
`**Steam URL:** ${i.fields.getTextInputValue('steam')}
**Yasaklayan Yetkili:** ${i.fields.getTextInputValue('yetkili')}
**Yasaklanma Tarihi:** ${i.fields.getTextInputValue('tarih')}

**Savunma:**
${i.fields.getTextInputValue('savunma')}`)
      .setFooter({ text: `Açan: ${i.user.tag}` })
      .setTimestamp();

    await ch.send({ embeds: [emb], allowedMentions: { parse: [] } });
    return i.reply({ content: `✅ Ticket açıldı: <#${ch.id}>`, flags: MessageFlags.Ephemeral });
  }

  if (i.customId === 'modal_sikayet') {
    const ch = await createTicketChannel(i.guild, i.user, 'oyuncu-sikayet');
    const emb = new EmbedBuilder()
      .setTitle('🎮 Oyuncu Şikayeti')
      .setColor(0xe74c3c)
      .setDescription(
`**Şüpheli Steam URL:** ${i.fields.getTextInputValue('steam')}
**Yeni Hesap mı?:** ${i.fields.getTextInputValue('yeni')}

**Şikayet Sebebi:**
${i.fields.getTextInputValue('sebep')}`)
      .setFooter({ text: `Açan: ${i.user.tag}` })
      .setTimestamp();

    await ch.send({ embeds: [emb], allowedMentions: { parse: [] } });
    return i.reply({ content: `✅ Ticket açıldı: <#${ch.id}>`, flags: MessageFlags.Ephemeral });
  }
}

export { closeTicketChannel };
