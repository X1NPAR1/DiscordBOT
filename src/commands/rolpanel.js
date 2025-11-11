import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { loadStore, saveStore } from '../lib/store.js';

export const data = new SlashCommandBuilder()
  .setName('rolpanel')
  .setDescription('Butonlara basarak rol alma paneli oluşturur.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addStringOption(o => o.setName('baslik').setDescription('Başlık').setRequired(true))
  // max 5 rol
  .addRoleOption(o => o.setName('rol1').setDescription('Rol 1'))
  .addStringOption(o => o.setName('etiket1').setDescription('Buton yazısı 1'))
  .addStringOption(o => o.setName('emoji1').setDescription('Emoji 1'))
  .addRoleOption(o => o.setName('rol2').setDescription('Rol 2'))
  .addStringOption(o => o.setName('etiket2').setDescription('Buton yazısı 2'))
  .addStringOption(o => o.setName('emoji2').setDescription('Emoji 2'))
  .addRoleOption(o => o.setName('rol3').setDescription('Rol 3'))
  .addStringOption(o => o.setName('etiket3').setDescription('Buton yazısı 3'))
  .addStringOption(o => o.setName('emoji3').setDescription('Emoji 3'))
  .addRoleOption(o => o.setName('rol4').setDescription('Rol 4'))
  .addStringOption(o => o.setName('etiket4').setDescription('Buton yazısı 4'))
  .addStringOption(o => o.setName('emoji4').setDescription('Emoji 4'))
  .addRoleOption(o => o.setName('rol5').setDescription('Rol 5'))
  .addStringOption(o => o.setName('etiket5').setDescription('Buton yazısı 5'))
  .addStringOption(o => o.setName('emoji5').setDescription('Emoji 5'));

export async function execute(interaction) {
  const title = interaction.options.getString('baslik', true);

  const roles = [];
  for (let i=1;i<=5;i++){
    const r = interaction.options.getRole(`rol${i}`);
    if (!r) continue;
    roles.push({
      roleId: r.id,
      label: interaction.options.getString(`etiket${i}`) ?? r.name,
      emoji: interaction.options.getString(`emoji${i}`) ?? undefined
    });
  }
  if (roles.length === 0) {
    return interaction.reply({ content: 'En az bir rol seçmelisin.', flags: MessageFlags.Ephemeral });
  }

  const row = new ActionRowBuilder();
  for (const r of roles) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`rolepanel:${r.roleId}`)
        .setLabel(r.label)
        .setStyle(ButtonStyle.Secondary)
        .setEmoji(r.emoji ?? null)
    );
  }

  const msg = await interaction.reply({ content: `**${title}**\nButona basarak rol alıp bırakabilirsiniz.`, components: [row] });

  const db = loadStore();
  db.rolePanels[msg.id] = { guildId: interaction.guild.id, roles };
  saveStore(db);
}
