import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
import { loadStore, saveStore } from '../lib/store.js';

export const data = new SlashCommandBuilder()
  .setName('warnreset')
  .setDescription('Bir kullanıcının uyarı sayısını 0 yapar.')
  .addUserOption(o => o.setName('kullanici').setDescription('Hedef').setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction) {
  const user = interaction.options.getUser('kullanici', true);
  const db = loadStore();
  db.warnings[interaction.guild.id] ??= {};
  db.warnings[interaction.guild.id][user.id] = 0;
  saveStore(db);

  return interaction.reply({
    content: `✅ ${user} uyarı sayısı **0** olarak sıfırlandı.`,
    flags: MessageFlags.Ephemeral,
  });
}
