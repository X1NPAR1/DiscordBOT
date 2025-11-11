import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { loadStore, saveStore } from '../lib/store.js';

export const data = new SlashCommandBuilder()
  .setName('ticket-setup')
  .setDescription('Ticket sistemini yapılandır.')
  .addChannelOption(o => o.setName('acik_kategori').setDescription('Açılan ticket kategorisi').setRequired(true))
  .addChannelOption(o => o.setName('kapali_kategori').setDescription('Kapanan ticket kategorisi').setRequired(true))
  .addRoleOption(o => o.setName('yetkili_rol').setDescription('Destek/Yetkili rolü').setRequired(true))
  .addRoleOption(o => o.setName('yonetici_rol').setDescription('Yönetici rolü (opsiyonel)').setRequired(false))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  const openCat = interaction.options.getChannel('acik_kategori', true);
  const closedCat = interaction.options.getChannel('kapali_kategori', true);
  const staff = interaction.options.getRole('yetkili_rol', true);
  const admin = interaction.options.getRole('yonetici_rol');

  if (openCat.type !== 4 || closedCat.type !== 4) {
    return interaction.reply({ content: '❌ Kategoriler **kanal kategorisi** olmalı.', ephemeral: true });
  }

  const db = loadStore();
  db.config.openCategoryId = openCat.id;
  db.config.closedCategoryId = closedCat.id;
  db.config.staffRoleId = staff.id;
  db.config.adminRoleId = admin?.id ?? null;
  saveStore(db);

  await interaction.reply({ content: '✅ Ticket ayarları kaydedildi.', ephemeral: true });
}
