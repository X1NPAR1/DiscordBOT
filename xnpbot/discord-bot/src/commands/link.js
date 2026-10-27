const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getPool } = require('../services/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('Steam hesabını Discord ile eşleştir')
    .addStringOption((opt) => opt.setName('code').setDescription('XXXX-XXXX formatındaki kod').setRequired(true)),
  async execute(interaction) {
    const code = interaction.options.getString('code');
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM link_codes WHERE code = ? AND used = 0 AND expiresAt > NOW()', [code]);
    if (!rows.length) {
      return interaction.reply({ content: 'Kod geçersiz veya süresi dolmuş.', ephemeral: true });
    }
    const payload = rows[0];
    const [existingDiscord] = await pool.query('SELECT * FROM linked_accounts WHERE discordId = ?', [interaction.user.id]);
    if (existingDiscord.length) {
      return interaction.reply({ content: 'Bu Discord hesabı zaten linkli.', ephemeral: true });
    }
    const [existingSteam] = await pool.query('SELECT * FROM linked_accounts WHERE steamId = ?', [payload.steamId]);
    if (existingSteam.length) {
      return interaction.reply({ content: 'Bu Steam hesabı başka bir Discord ile linkli.', ephemeral: true });
    }
    await pool.query('INSERT INTO linked_accounts (discordId, steamId, linkedAt) VALUES (?, ?, NOW())', [interaction.user.id, payload.steamId]);
    await pool.query('UPDATE link_codes SET used = 1 WHERE id = ?', [payload.id]);

    const embed = new EmbedBuilder()
      .setTitle('Hesap bağlama tamamlandı')
      .setDescription(`Steam ID **${payload.steamId}** ile eşleştirildi.`)
      .setColor(0x00ad83);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
