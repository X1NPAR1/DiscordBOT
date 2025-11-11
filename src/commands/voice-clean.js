import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { loadStore, saveStore } from '../lib/store.js';

export const data = new SlashCommandBuilder()
  .setName('voice-clean')
  .setDescription('Aktif olmayan tüm geçici kanalları temizler.')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild);

export async function execute(interaction) {
  const db = loadStore();
  const cfg = db.config;
  if (!cfg.tempVoiceCategoryId) return interaction.reply({ content: '❌ Kategori ayarlı değil.', ephemeral: true });
  const catId = cfg.tempVoiceCategoryId;

  let removed = 0;
  const channels = interaction.guild.channels.cache.filter(ch => ch.parentId === catId && (ch.type === ChannelType.GuildVoice || ch.type === ChannelType.GuildText));
  for (const ch of channels.values()) {
    // lobby veya aktif metinler hariç; boş ses kanalları ve sahipsiz textleri uçur
    const isLobby = ch.type === ChannelType.GuildVoice && ch.name === cfg.tempVoiceLobbyName;
    if (isLobby) continue;

    if (ch.type === ChannelType.GuildVoice && ch.members.size === 0) {
      await ch.delete('Temizlik').catch(()=>{});
      removed++;
    }
    if (ch.type === ChannelType.GuildText) {
      const isInDb = Object.values(db.tempVoice).some(r => r.textId === ch.id);
      if (!isInDb) { await ch.delete('Sahipsiz komut kanalı').catch(()=>{}); removed++; }
    }
  }
  // DB senk: var olmayanları temizle
  for (const [ownerId, rec] of Object.entries(db.tempVoice)) {
    if (!interaction.guild.channels.cache.has(rec.voiceId)) delete db.tempVoice[ownerId];
  }
  saveStore(db);

  return interaction.reply({ content: `🧹 Temizlik tamam: ${removed} kanal kaldırıldı.`, ephemeral: true });
}
