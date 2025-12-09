const { EmbedBuilder } = require('discord.js');

async function startStatusLoop(client, config, fetchStatus) {
  if (!config.status?.statusChannelId) return;
  const channel = await client.channels.fetch(config.status.statusChannelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return;

  let message;
  if (config.status.statusMessageId) {
    message = await channel.messages.fetch(config.status.statusMessageId).catch(() => null);
  }
  if (!message) {
    message = await channel.send({ content: 'Status hazırlanıyor...' });
    console.log('Yeni status mesajı oluşturuldu, ID:', message.id);
  }

  setInterval(async () => {
    const status = await fetchStatus();
    const embed = new EmbedBuilder()
      .setTitle(status.name)
      .setDescription(status.online ? '🟢 Online' : '🔴 Offline')
      .addFields(
        { name: 'IP', value: status.ip, inline: true },
        { name: 'Port', value: String(status.port), inline: true },
        { name: 'Oyuncular', value: `${status.players}/${status.maxPlayers}`, inline: true }
      )
      .setFooter({ text: `Son güncelleme: ${new Date().toLocaleTimeString()}` })
      .setColor(status.online ? 0x2ecc71 : 0xe74c3c);
    await message.edit({ embeds: [embed] });
  }, 60_000);
}

module.exports = { startStatusLoop };
