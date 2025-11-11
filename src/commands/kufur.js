import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { loadStore, saveStore } from '../lib/store.js';

export const data = new SlashCommandBuilder()
  .setName('kufur')
  .setDescription('Küfür filtresi ayarları')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand(s => s.setName('durum')
    .setDescription('Durumu gösterir'))
  .addSubcommand(s => s.setName('ac').setDescription('Filtreyi aç'))
  .addSubcommand(s => s.setName('kapat').setDescription('Filtreyi kapat'))
  .addSubcommand(s => s.setName('kategori')
    .setDescription('Kategori aç/kapat')
    .addStringOption(o => o.setName('ad').setDescription('family|religion|national').setRequired(true))
    .addBooleanOption(o => o.setName('acik').setDescription('true/false').setRequired(true)))
  .addSubcommand(s => s.setName('ekle')
    .setDescription('Özel kelime ekle')
    .addStringOption(o => o.setName('kelime').setDescription('Kelime').setRequired(true)))
  .addSubcommand(s => s.setName('sil')
    .setDescription('Özel kelime sil')
    .addStringOption(o => o.setName('kelime').setDescription('Kelime').setRequired(true)));

export async function execute(interaction) {
  const db = loadStore();
  const sw = db.config.swear;

  const sub = interaction.options.getSubcommand();
  if (sub === 'durum') {
    return interaction.reply({ content:
      `Durum: ${sw.enabled ? 'Açık' : 'Kapalı'}\n`+
      `Ailevi:${sw.family?'✅':'❌'} Dini:${sw.religion?'✅':'❌'} Milli:${sw.national?'✅':'❌'}\n`+
      `Özel: ${sw.custom.join(', ') || '—'}` });
  }
  if (sub === 'ac') { sw.enabled = true; saveStore(db); return interaction.reply('✅ Filtre açıldı.'); }
  if (sub === 'kapat') { sw.enabled = false; saveStore(db); return interaction.reply('✅ Filtre kapatıldı.'); }
  if (sub === 'kategori') {
    const key = interaction.options.getString('ad', true);
    const val = interaction.options.getBoolean('acik', true);
    if (!(key in sw)) return interaction.reply({ content: 'Geçersiz kategori.', flags: MessageFlags.Ephemeral });
    sw[key] = val; saveStore(db);
    return interaction.reply(`✅ **${key}** ${val?'açık':'kapalı'}.`);
  }
  if (sub === 'ekle') {
    const k = interaction.options.getString('kelime', true).toLowerCase();
    if (!sw.custom.includes(k)) sw.custom.push(k);
    saveStore(db);
    return interaction.reply(`✅ \`${k}\` eklendi.`);
  }
  if (sub === 'sil') {
    const k = interaction.options.getString('kelime', true).toLowerCase();
    sw.custom = sw.custom.filter(x=>x!==k);
    saveStore(db);
    return interaction.reply(`✅ \`${k}\` silindi.`);
  }
}
