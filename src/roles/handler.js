// src/roles/handler.js
import {
  PermissionFlagsBits,
  MessageFlags,
} from 'discord.js';

/**
 * role button customId formatı: "role:<ROL_ID>"
 * Örn: role:123456789012345678
 */
export async function handleRoleButton(interaction) {
  if (!interaction.isButton()) return;
  const id = interaction.customId || '';
  if (!id.startsWith('role:')) return; // bizim buton değil

  const roleId = id.split(':')[1];
  const role = interaction.guild.roles.cache.get(roleId)
           || await interaction.guild.roles.fetch(roleId).catch(() => null);
  if (!role) {
    return interaction.reply({
      content: '❌ Rol bulunamadı.',
      flags: MessageFlags.Ephemeral,
    });
  }

  // Bot yetkisi ve rol hiyerarşisi kontrolü
  const me = interaction.guild.members.me;
  if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) {
    return interaction.reply({
      content: '❌ Rolleri yönetebilmem için **Manage Roles** izni gerekli.',
      flags: MessageFlags.Ephemeral,
    });
  }
  if (role.position >= me.roles.highest.position) {
    return interaction.reply({
      content: '❌ Bu rol, botun en yüksek rolünün üzerinde. Verip alamam.',
      flags: MessageFlags.Ephemeral,
    });
  }

  // Toggle ekle/çıkar
  const member = interaction.member;
  const has = member.roles.cache.has(role.id);

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  try {
    if (has) {
      await member.roles.remove(role, 'Role panel butonu (toggle remove)');
      await interaction.editReply({ content: `🗑️ **${role.name}** rolün kaldırıldı.` });
    } else {
      await member.roles.add(role, 'Role panel butonu (toggle add)');
      await interaction.editReply({ content: `✅ **${role.name}** rolün verildi.` });
    }
  } catch (e) {
    await interaction.editReply({
      content: `❌ Rol verilirken/çekilirken hata: ${e.message ?? e}`,
    });
  }
}
