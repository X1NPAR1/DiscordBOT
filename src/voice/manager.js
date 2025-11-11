import { ChannelType } from 'discord.js';
import { EmbedBuilder } from 'discord.js';
import { loadStore, saveStore } from '../lib/store.js';

// Sadece oda sahibinin görebildiği text kanal izinleri (bota da izin vereceğiz)
function canSeeOnlyOwner(guild, ownerId, meId) {
  const base = [
    { id: guild.roles.everyone, deny: ['ViewChannel'] },
    { id: ownerId, allow: ['ViewChannel','SendMessages','AttachFiles','EmbedLinks','ManageMessages'] },
  ];
  // Bot admin değilse, explicit izin ver
  if (meId) {
    base.push({ id: meId, allow: ['ViewChannel','SendMessages','AttachFiles','EmbedLinks','ManageMessages'] });
  }
  return base;
}

function buildVoiceHelpEmbed(ownerId) {
  return new EmbedBuilder()
    .setTitle('🎧 Geçici Kanallar Komutlar')
    .setColor(0x5865F2)
    .setDescription(
      'Bu komutlar **yalnızca kendi komut-kanalında** ve **kendi özel odan** için çalışır.\n' +
      `Sahip: <@${ownerId}>`
    )
    .addFields(
      { name: '`/voice-claim`',              value: 'Geçici sesli kanalın sahipliğini talep eder.', inline: false },
      { name: '`/voice-clean`',              value: 'Aktif olmayan tüm geçici kanalları temizler. *(Yönetici)*', inline: false },
      { name: '`/voice-hide`',               value: 'Geçici sesli kanalı gizler (herkese kapalı).', inline: false },
      { name: '`/voice-kick [member]`',      value: 'Belirtilen üyeyi geçici sesli kanaldan atar.', inline: false },
      { name: '`/voice-limit [user_limit]`', value: 'Geçici ses kanalının kullanıcı sınırını değiştirir (0 = sınırsız).', inline: false },
      { name: '`/voice-lock`',               value: 'Geçici ses kanalını kilitler (Connect kapalı).', inline: false },
      { name: '`/voice-owner`',              value: 'Geçici ses kanalının sahibini gösterir.', inline: false },
      { name: '`/voice-rename [name]`',      value: 'Geçici ses kanalının adını değiştirir.', inline: false },
      { name: '`/voice-reveal`',             value: 'Geçici ses kanalını herkese görünür yapar.', inline: false },
      { name: '`/voice-transfer [member]`',  value: 'Geçici ses kanalının sahipliğini devreder.', inline: false },
      { name: '`/voice-unlock`',             value: 'Geçici ses kanalının kilidini kaldırır.', inline: false },
    )
    .setFooter({ text: 'İpucu: Komutları bu kanalda / yazarak görebilirsin.' });
}

export async function onVoiceStateUpdate(oldState, newState) {
  const db = loadStore();
  const cfg = db.config;
  const guild = newState.guild ?? oldState.guild;

  const joined = newState?.channel;
  if (
    joined &&
    cfg.tempVoiceCategoryId &&
    joined.parentId === cfg.tempVoiceCategoryId &&
    joined.type === ChannelType.GuildVoice &&
    joined.name === cfg.tempVoiceLobbyName
  ) {
    const owner = newState.member.user;
    const meId = guild.members.me?.id;

    // Zaten odası varsa oraya taşı
    if (db.tempVoice[owner.id]?.voiceId && guild.channels.cache.has(db.tempVoice[owner.id].voiceId)) {
      const vc = guild.channels.cache.get(db.tempVoice[owner.id].voiceId);
      await newState.setChannel(vc).catch(() => {});
      return;
    }

    // ÖZEL SES KANALI (bota explicit izin)
    const voice = await guild.channels.create({
      name: `#${Math.floor(1 + Math.random() * 9)} - ${owner.username}`,
      type: ChannelType.GuildVoice,
      parent: cfg.tempVoiceCategoryId,
      permissionOverwrites: [
        { id: guild.roles.everyone, deny: ['ViewChannel','Connect'] },
        { id: owner.id, allow: ['ViewChannel','Connect','Speak','Stream','UseVAD','PrioritySpeaker','MuteMembers','DeafenMembers','MoveMembers'] },
        ...(meId ? [{ id: meId, allow: ['ViewChannel','Connect','MoveMembers'] }] : []),
      ]
    });

    // KOMUT KANALI (owner + bot görsün)
    const text = await guild.channels.create({
      name: `${owner.username}-oda`,
      type: ChannelType.GuildText,
      parent: cfg.tempVoiceCategoryId,
      permissionOverwrites: canSeeOnlyOwner(guild, owner.id, meId)
    });

    // Kaydet
    db.tempVoice[owner.id] = { voiceId: voice.id, textId: text.id, guildId: guild.id, createdAt: Date.now() };
    saveStore(db);

    // Taşı (Move Members lazım)
    try {
      await newState.setChannel(voice);
    } catch {
      try {
        await owner.send(
          `Özel odan hazır: **${voice.name}** → <#${voice.id}>.\n` +
          `Seni oraya **taşıyamadım**. Botun **Üyeleri Taşı (Move Members)** izni veya kanal izinleri eksik olabilir, lütfen kanala elle geç.`
        );
      } catch {}
    }

    // Bilgilendirme mesajı — botun kanalı görebilmesi için explicit izin verdik
    try {
      await text.send({
        content: `👋 <@${owner.id}> özel odan hazır!`,
        embeds: [buildVoiceHelpEmbed(owner.id)]
      });
    } catch {
      // Hâlâ erişemiyorsa en azından DM at
      try {
        await owner.send(`Özel odan hazır: <#${voice.id}> — Komutları kullanmak için <#${text.id}> kanalını kullan.`);
      } catch {}
    }
  }

  // Boşalan özel odaları kaldır
  const left = oldState?.channel;
  if (
    left &&
    cfg.tempVoiceCategoryId &&
    left.parentId === cfg.tempVoiceCategoryId &&
    left.type === ChannelType.GuildVoice &&
    left.name !== cfg.tempVoiceLobbyName
  ) {
    if (left.members.size === 0) {
      const ownerId = Object.keys(db.tempVoice).find(uid => db.tempVoice[uid].voiceId === left.id);
      const record = ownerId ? db.tempVoice[ownerId] : null;

      if (record) {
        const t = guild.channels.cache.get(record.textId);
        if (t) await t.delete('Özel oda kapandı').catch(() => {});
        await left.delete('Özel oda boşaldı').catch(() => {});
        delete db.tempVoice[ownerId];
        saveStore(db);
      } else {
        await left.delete('Boş geçici oda').catch(() => {});
      }
    }
  }
}

export function getOwnedVoiceByTextChannel(guild, userId, textChannelId) {
  const db = loadStore();
  const rec = db.tempVoice[userId];
  if (!rec) return null;
  if (rec.guildId !== guild.id) return null;
  if (rec.textId !== textChannelId) return null;
  const voice = guild.channels.cache.get(rec.voiceId);
  if (!voice) return null;
  return voice;
}

export function isOwnerTextChannel(guild, userId, textChannelId) {
  const db = loadStore();
  const rec = db.tempVoice[userId];
  return !!(rec && rec.guildId === guild.id && rec.textId === textChannelId);
}
