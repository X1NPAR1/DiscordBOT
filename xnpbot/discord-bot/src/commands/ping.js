const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Bot gecikmesini ölçer'),
  async execute(interaction) {
    const sent = await interaction.reply({ content: 'Pong...', fetchReply: true, ephemeral: true });
    const diff = sent.createdTimestamp - interaction.createdTimestamp;
    await interaction.editReply(`Pong! ${diff}ms`);
  }
};
