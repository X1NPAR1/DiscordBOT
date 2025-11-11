import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { loadStore, saveStore } from '../lib/store.js';

export const data = new SlashCommandBuilder()
  .setName('odakategori')
  .setDescription('Geçici oda sisteminin kategorisini/lobi adını ayarla ve lobi oluştur.')
  .addChannelOption(o => o.setName('kategori').setDescription('Oda ve lobi için kategori').setRequired(true))
  .addStringOption(o => o.setName('lobi_adi').setDescription('Lobi ses kanal adı (varsayılan:🟢 Oda Oluştur [+])'))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  const cat = interaction.options.getChannel('kategori', true);
  if (cat.type !== 4) {
    return interaction.reply({ content: '❌ Seçilen kanal bir **kategori** olmalı.', ephemeral: true });
  }
  const lobbyName = interaction.options.getString('lobi_adi') ?? '🟢 Oda Oluştur [+]';

  const db = loadStore();
  db.config.tempVoiceCategoryId = cat.id;
  db.config.tempVoiceLobbyName  = lobbyName;
  saveStore(db);

  // Lobi varsa dokunma; yoksa oluştur
  const exist = interaction.guild.channels.cache.find(ch => ch.parentId === cat.id && ch.type === 2 && ch.name === lobbyName);
  if (!exist) {
    await interaction.guild.channels.create({
      name: lobbyName, type: 2, parent: cat.id,
      userLimit: 0, // sınırsız
      permissionOverwrites: [
        { id: interaction.guild.roles.everyone, allow: ['ViewChannel','Connect'] }
      ]
    });
  }

  return interaction.reply({ content: `✅ Lobi ayarlandı: **${lobbyName}** @ **${cat.name}**`, ephemeral: true });
}
