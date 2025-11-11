import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';

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
  .setName('rolsil')
  .setDescription('Panel mesajındaki belirli rol butonunu kaldırır (sadece o mesajdan).')
  .addStringOption(o =>
    o.setName('mesajid')
      .setDescription('Butonun bulunduğu panel mesajının ID’si')
      .setRequired(true)
  )
  .addRoleOption(o =>
    o.setName('rol')
      .setDescription('Butonu silinecek rol')
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

export async function execute(interaction) {
  const messageId = interaction.options.getString('mesajid', true);
  const role      = interaction.options.getRole('rol', true);

  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return interaction.reply({ content: 'Bu komut için `Manage Roles` izni gerekir.', flags: MessageFlags.Ephemeral });
  }

  const msg = await interaction.channel.messages.fetch(messageId).catch(() => null);
  if (!msg) {
    return interaction.reply({ content: 'Mesaj bulunamadı. ID doğru mu ve aynı kanalda mısın?', flags: MessageFlags.Ephemeral });
  }
  if (msg.author.id !== interaction.client.user.id) {
    return interaction.reply({ content: 'Bu mesaj bana ait değil; düzenleyemem.', flags: MessageFlags.Ephemeral });
  }

  const rows = cloneRows(msg.components);
  const targetId = `role:${role.id}`;

  // Taranan butonu çıkar
  let removed = false;
  for (const row of rows) {
    const before = row.components.length;
    // @ts-ignore
    row.components = row.components.filter(b => b.data?.custom_id !== targetId);
    if (row.components.length !== before) removed = true;
  }

  if (!removed) {
    return interaction.reply({ content: 'Bu mesajda bu role ait bir buton bulunamadı.', flags: MessageFlags.Ephemeral });
  }

  // Boş kalan satırları temizle
  const compact = rows.filter(r => (r.components?.length ?? 0) > 0);

  await msg.edit({ components: compact });
  return interaction.reply({
    content: `🗑️ Kaldırıldı: **${role.name}** butonu bu mesajdan silindi.`,
    flags: MessageFlags.Ephemeral,
  });
}
