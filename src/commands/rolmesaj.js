import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  EmbedBuilder,
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('rolmesaj')
  .setDescription('Rol butonları için boş bir panel mesajı gönderir.')
  .addStringOption(o =>
    o.setName('mesaj')
      .setDescription('Panelin üst metni (ör. “Aşağıdan rollerinizi seçin”)')
      .setRequired(true)
  )
  // Yetkili kilidi: ManageRoles
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

export async function execute(interaction) {
  const text = interaction.options.getString('mesaj', true);

  // Botun mesaj göndermek için izni var mı?
  const me = interaction.guild.members.me;
  const canSend = interaction.channel.permissionsFor(me)?.has(PermissionFlagsBits.SendMessages);
  if (!canSend) {
    return interaction.reply({ content: 'Bu kanalda mesaj göndermeye iznim yok.', flags: MessageFlags.Ephemeral });
  }

  const emb = new EmbedBuilder()
    .setTitle('🎭 Rol Paneli')
    .setDescription(text)
    .setColor(0x5865F2);

  const msg = await interaction.channel.send({ embeds: [emb], components: [] });

  return interaction.reply({
    content: `✅ Panel gönderildi. **Mesaj ID:** \`${msg.id}\`\nŞimdi **/rolemoji** ile buton(lar) ekleyebilirsin.`,
    flags: MessageFlags.Ephemeral,
  });
}
