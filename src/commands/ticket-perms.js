import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { loadStore, saveStore } from '../lib/store.js';

export const data = new SlashCommandBuilder()
  .setName('ticket-perms')
  .setDescription('Ticket kapatma/silme yetkisi rolleri ayarla.')
  .addRoleOption(o => o.setName('kapatma_rol').setDescription('Kapatma yetkisi vereceğin rol').setRequired(false))
  .addRoleOption(o => o.setName('silme_rol').setDescription('Silme yetkisi vereceğin rol').setRequired(false))
  .addBooleanOption(o => o.setName('sifirla').setDescription('Tüm özel yetkileri sıfırla').setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  const reset = interaction.options.getBoolean('sifirla') ?? false;
  const kapatmaRol = interaction.options.getRole('kapatma_rol');
  const silmeRol = interaction.options.getRole('silme_rol');

  const db = loadStore();
  const cfg = db.config;

  if (reset) {
    cfg.closeRoleId = null;
    cfg.deleteRoleId = null;
    saveStore(db);
    return interaction.reply({ content: '✅ Ticket özel yetkileri sıfırlandı.', ephemeral: true });
  }

  if (kapatmaRol) cfg.closeRoleId = kapatmaRol.id;
  if (silmeRol) cfg.deleteRoleId = silmeRol.id;
  saveStore(db);

  return interaction.reply({
    content:
      `✅ Güncellendi:\n- Kapatma Rolü: ${cfg.closeRoleId ? `<@&${cfg.closeRoleId}>` : '—'}\n- Silme Rolü: ${cfg.deleteRoleId ? `<@&${cfg.deleteRoleId}>` : '—'}`,
    ephemeral: true
  });
}
