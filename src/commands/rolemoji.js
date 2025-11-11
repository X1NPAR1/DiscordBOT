import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';

// "<:name:123>" veya "<a:name:123>" -> { id:'123', name:'name' }
// unicode emoji -> { name:'😀' }
function parseEmoji(input) {
  const m = input.match(/^<a?:([^:]+):(\d+)>$/);
  if (m) return { id: m[2], name: m[1] };
  return { name: input };
}

// Mevcut buton satırlarını güvenli şekilde yeniden kur
function cloneRows(components) {
  const rows = [];
  for (const row of (components ?? [])) {
    const r = new ActionRowBuilder();
    for (const c of (row.components ?? [])) {
      if (c.type !== 2) continue;
      const b = new ButtonBuilder()
        .setCustomId(c.customId)
        .setLabel(c.label ?? '')
        .setStyle(c.style ?? ButtonStyle.Secondary);
      if (c.emoji) b.setEmoji(c.emoji);
      r.addComponents(b);
    }
    rows.push(r);
  }
  return rows;
}

export const data = new SlashCommandBuilder()
  .setName('rolemoji')
  .setDescription('Bir panel mesajına emoji’li rol butonu ekler veya günceller.')
  .addStringOption(o =>
    o.setName('mesajid')
      .setDescription('Buton eklenecek/güncellenecek panel mesajının ID’si')
      .setRequired(true)
  )
  .addStringOption(o =>
    o.setName('emoji')
      .setDescription('Butonda gözükecek emoji (unicode veya <:ad:id>)')
      .setRequired(true)
  )
  .addRoleOption(o =>
    o.setName('rol')
      .setDescription('Butona basılınca verilecek/geri alınacak rol')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

export async function execute(interaction) {
  const messageId = interaction.options.getString('mesajid', true);
  const emojiRaw  = interaction.options.getString('emoji', true);
  const role      = interaction.options.getRole('rol', true);

  // Yetki kontrolleri
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return interaction.reply({ content: 'Bu komut için `Manage Roles` izni gerekir.', flags: MessageFlags.Ephemeral });
  }
  const me = interaction.guild.members.me;
  if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return interaction.reply({ content: 'Rolleri yönetebilmem için `Manage Roles` izni gerekli.', flags: MessageFlags.Ephemeral });
  }
  if (role.position >= me.roles.highest.position) {
    return interaction.reply({ content: 'Bu rol, benim en yüksek rolümün üzerinde. Buton eklesem de veremem.', flags: MessageFlags.Ephemeral });
  }

  // Mesajı çek
  const msg = await interaction.channel.messages.fetch(messageId).catch(() => null);
  if (!msg) {
    return interaction.reply({ content: 'Mesaj bulunamadı. ID doğru mu ve aynı kanalda mısın?', flags: MessageFlags.Ephemeral });
  }
  if (msg.author.id !== interaction.client.user.id) {
    return interaction.reply({ content: 'Bu mesaj bana ait değil; düzenleyemem.', flags: MessageFlags.Ephemeral });
  }

  const rows = cloneRows(msg.components);
  const emoji = parseEmoji(emojiRaw);
  const targetId = `role:${role.id}`;

  // 1) Eğer aynı rol için buton zaten varsa → emoji/label güncelle
  let updated = false;
  for (const row of rows) {
    for (const b of row.components) {
      // @ts-ignore (djs builder var)
      if (b.data?.custom_id === targetId) {
        b.setLabel(role.name);
        b.setStyle(ButtonStyle.Secondary);
        b.setEmoji(emoji);
        updated = true;
        break;
      }
    }
    if (updated) break;
  }

  // 2) Yoksa yeni buton ekle (satır limiti 5, buton/row 5)
  if (!updated) {
    let targetRow = rows.find(r => (r.components?.length ?? 0) < 5);
    if (!targetRow) {
      if (rows.length >= 5) {
        return interaction.reply({ content: 'Bu mesaja daha fazla buton eklenemez (limit 25).', flags: MessageFlags.Ephemeral });
      }
      targetRow = new ActionRowBuilder();
      rows.push(targetRow);
    }
    const btn = new ButtonBuilder()
      .setCustomId(targetId)
      .setLabel(role.name)
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(emoji);
    targetRow.addComponents(btn);
  }

  await msg.edit({ components: rows });
  return interaction.reply({
    content: updated
      ? `✏️ Güncellendi: **${role.name}** için emoji ${emojiRaw} olarak değiştirildi.`
      : `✅ Eklendi: **${role.name}** için ${emojiRaw} butonu eklendi.`,
    flags: MessageFlags.Ephemeral,
  });
}
