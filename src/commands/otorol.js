import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { loadStore, saveStore } from '../lib/store.js';

export const data = new SlashCommandBuilder()
  .setName('otorol')
  .setDescription('Sunucuya katılana otomatik rol ver (ayar).')
  .addSubcommand(s =>
    s.setName('ayarla')
     .setDescription('Otorolü ayarla')
     .addRoleOption(r => r.setName('rol').setDescription('Verilecek rol').setRequired(true))
  )
  .addSubcommand(s =>
    s.setName('kapat').setDescription('Otorolü kapat')
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  const sub = interaction.options.getSubcommand();
  const db = loadStore();

  if (sub === 'ayarla') {
    const role = interaction.options.getRole('rol', true);
    db.config.autoroleId = role.id;
    saveStore(db);
    return interaction.reply({ content: `✅ Otorol **${role.name}** olarak ayarlandı.` });
  }

  if (sub === 'kapat') {
    db.config.autoroleId = null;
    saveStore(db);
    return interaction.reply({ content: '✅ Otorol kapatıldı.' });
  }
}
