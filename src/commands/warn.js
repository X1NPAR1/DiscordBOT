import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  EmbedBuilder,
} from 'discord.js';
import { loadStore, saveStore } from '../lib/store.js';
import { isOwnerTextChannel } from '../voice/manager.js';

export const data = new SlashCommandBuilder()
  .setName('warn')
  .setDescription('Kullanıcıyı uyarır (kademeli yaptırım uygular).')
  .addUserOption(o => o.setName('kullanici').setDescription('Uyarılacak kişi').setRequired(true))
  .addStringOption(o => o.setName('sebep').setDescription('Sebep'))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

const STEPS = [
  { count: 1, minutes: 5  },
  { count: 2, minutes: 10 },
  { count: 3, minutes: 30 },
  { count: 4, ban: true  },
];

function footerLine(interaction) {
  const now = new Date();
  const hh = now.getHours().toString().padStart(2,'0');
  const mm = now.getMinutes().toString().padStart(2,'0');
  return `Zenith Yetkili Ekibinden (${interaction.user.tag}) - ${hh}:${mm}`;
}

export async function execute(interaction) {
  // özel oda komut-kanalında kullanma
  if (isOwnerTextChannel(interaction.guild, interaction.user.id, interaction.channelId)) {
    return interaction.reply({ content: 'Bu komut burada kullanılamaz.', flags: MessageFlags.Ephemeral });
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const target = interaction.options.getUser('kullanici', true);
  const reason = interaction.options.getString('sebep') ?? 'Kural ihlali';
  const guild  = interaction.guild;

  const member = await guild.members.fetch(target.id).catch(() => null);
  if (!member) return interaction.editReply({ content: '❌ Kullanıcı bu sunucuda bulunamadı.' });

  // --- güvenli sayaç okuma/artırma (0–4 arası) ---
  const db = loadStore();
  db.warnings[guild.id] ??= {};
  const g = db.warnings[guild.id];

  const prevRaw = g[target.id];
  const prev = Number.isFinite(prevRaw) ? prevRaw : parseInt(prevRaw ?? '0', 10);
  const safePrev = Number.isFinite(prev) && prev >= 0 ? prev : 0;

  // clamp +1 ve 4’ü geçme
  const next = Math.min(safePrev + 1, 4);
  g[target.id] = next;
  saveStore(db);

  const step = STEPS.find(s => s.count === next) ?? STEPS[STEPS.length - 1];

  // DM bilgilendirme (fail olsa da devam)
  try {
    const dmEmb = new EmbedBuilder()
      .setTitle('⚠️ Uyarı Aldınız')
      .setDescription(`**Sunucu:** ${guild.name}\n**Sebep:** ${reason}\n**Uyarı Sayısı:** ${next}`)
      .setColor(0xE67E22)
      .setFooter({ text: footerLine(interaction) })
      .setTimestamp();
    await target.send({ embeds: [dmEmb] }).catch(() => {});
  } catch {}

  let actionText = '—';
  let acted = false;

  // Sadece prev < 4 ve next === 4 anında ban dene (tekrar banlama)
  const shouldBanNow = step.ban && safePrev < 4 && next === 4;

  try {
    if (shouldBanNow) {
      if (!guild.members.me?.permissions.has(PermissionFlagsBits.BanMembers)) {
        actionText = '4. uyarı: Ban gerekliydi ama botun **Ban Members** izni yok.';
      } else if (guild.members.me.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
        actionText = '4. uyarı: Ban gerekliydi ama bot rolü, hedefin rolünden **aşağıda**.';
      } else if (member.id === guild.ownerId) {
        actionText = '4. uyarı: Sunucu sahibini banlayamazsın.';
      } else {
        await member.ban({ reason: `4. uyarı -> kalıcı ban | ${reason}` });
        actionText = '4. uyarı: **Kalıcı ban** uygulandı.';
        acted = true;
      }
    } else if (step.minutes) {
      const ms = step.minutes * 60 * 1000;
      if (!guild.members.me?.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        actionText = `${step.count}. uyarı: ${step.minutes} dk timeout gerekliydi ama botun **Moderate Members** izni yok.`;
      } else if (guild.members.me.roles.highest.comparePositionTo(member.roles.highest) <= 0) {
        actionText = `${step.count}. uyarı: ${step.minutes} dk timeout gerekliydi ama bot rolü, hedefin rolünden **aşağıda**.`;
      } else {
        await member.timeout(ms, `Uyarı #${step.count} (${step.minutes} dk) | ${reason}`);
        actionText = `Uyarı #${step.count}: **${step.minutes} dakika** timeout uygulandı.`;
        acted = true;
      }
    } else {
      actionText = '—';
    }
  } catch {
    actionText = 'Yaptırım uygulanırken beklenmeyen bir hata oluştu.';
  }

  const replyEmb = new EmbedBuilder()
    .setTitle('⚠️ Uyarı Verildi')
    .setDescription(`**Kullanıcı:** ${target}\n**Sebep:** ${reason}\n**Toplam Uyarı:** ${next}\n${actionText}`)
    .setColor(acted ? 0xE67E22 : 0xF1C40F)
    .setFooter({ text: footerLine(interaction) })
    .setTimestamp();

  await interaction.editReply({ embeds: [replyEmb] });

  const logId = process.env.MODLOG_CHANNEL_ID;
  if (logId) {
    const ch = guild.channels.cache.get(logId);
    ch?.send({ embeds: [replyEmb] }).catch(() => {});
  }
}
