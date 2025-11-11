import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { isOwnerTextChannel, getOwnedVoiceByTextChannel } from '../voice/manager.js';
import { loadStore, saveStore } from '../lib/store.js';

export const data = new SlashCommandBuilder()
  .setName('voice-transfer')
  .setDescription('Oda sahipliğini devret.')
  .addUserOption(o => o.setName('member').setDescription('Yeni sahip').setRequired(true));

export async function execute(interaction) {
  const guild = interaction.guild;
  const db = loadStore();
  const rec = db.tempVoice[interaction.user.id];
  if (!rec || rec.textId !== interaction.channelId) {
    return interaction.reply({ content: '❌ Bu komut sadece **kendi komut-kanalında** ve **sahip** tarafından kullanılabilir.', ephemeral: true });
  }
  const newOwner = interaction.options.getUser('member', true);
  // sahipliği devir: kayıt taşı
  db.tempVoice[newOwner.id] = { ...rec };
  delete db.tempVoice[interaction.user.id];
  saveStore(db);

  // komut-kanalı sadece yeni sahibin görmesi için izinleri güncelle
  const text = guild.channels.cache.get(rec.textId);
  if (text) {
    await text.permissionOverwrites.set([
      { id: guild.roles.everyone, deny: ['ViewChannel'] },
      { id: newOwner.id, allow: ['ViewChannel','SendMessages','AttachFiles','EmbedLinks','ManageMessages'] }
    ]).catch(()=>{});
    await text.setName(`${newOwner.username}-oda`).catch(()=>{});
  }
  // ses kanalında da owner’a opsiyonel özel izin verelim
  const vc = guild.channels.cache.get(rec.voiceId);
  if (vc) {
    await vc.permissionOverwrites.edit(newOwner.id, { Connect: true, Speak: true, MoveMembers: true }).catch(()=>{});
  }

  return interaction.reply({ content: `✅ Sahiplik <@${newOwner.id}> kişisine devredildi.`, ephemeral: true });
}
