import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('dmduyuru')
  .setDescription('Sunucudaki herkese DM duyuru gönderir (yalnızca admin).')
  .addStringOption(o =>
    o.setName('mesaj').setDescription('Duyuru metni').setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  const text = interaction.options.getString('mesaj', true);
  await interaction.reply({ content: 'DM duyurusu başlatıldı. Bu işlem biraz sürebilir.', ephemeral: true });

  const delay = (ms) => new Promise(r => setTimeout(r, ms));
  const members = await interaction.guild.members.fetch();
  let sent = 0, skipped = 0;

  for (const [, m] of members) {
    if (m.user.bot) { skipped++; continue; }
    try {
      await m.send({ content: `📣 ${text}\n\n– Zenith Yetkili Ekibinden (${interaction.user.tag})` });
      sent++;
      await delay(1100); // rate limit koruması
    } catch {
      skipped++;
      await delay(400);
    }
  }

  await interaction.followUp({
    content: `DM duyuru tamamlandı. Gönderildi: ${sent}, Atlandı: ${skipped}`,
    ephemeral: true
  });
}
