module.exports = {
  name: 'interactionCreate',
  async execute(client, config, interaction) {
    if (!interaction.isChatInputCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction, config);
    } catch (err) {
      console.error('Komut hatası:', err);
      const content = 'Komut çalışırken bir hata oluştu.';
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content, ephemeral: true });
      } else {
        await interaction.reply({ content, ephemeral: true });
      }
    }
  }
};
