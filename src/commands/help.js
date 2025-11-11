// src/commands/help.js
import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('help')
  .setDescription('Komut listesini ve açıklamaları gösterir.')
  .addStringOption(o =>
    o.setName('kategori')
      .setDescription('İsteğe bağlı kategori filtresi')
      .addChoices(
        { name: 'Genel', value: 'genel' },
        { name: 'Duyuru', value: 'duyuru' },
        { name: 'Moderasyon', value: 'moderasyon' },
        { name: 'Ticket', value: 'ticket' },
        { name: 'Çekiliş', value: 'cekilis' },
        { name: 'Sunucu', value: 'sunucu' },
        { name: 'Oda (Geçici)', value: 'oda' },
        { name: 'Rol Paneli', value: 'rol' },
      )
  );

export async function execute(interaction) {
  const kat = interaction.options.getString('kategori');

  // ==== KATEGORİ METİNLERİ ====
  const GENEL = [
    '`/help [kategori]` – Bu menü.',
    '`/durum` – CS:GO/CS2 sunucu durumunu gösterir (slot, harita, isim vs.) (ephemeral).',
  ].join('\n');

  const DUYURU = [
    '`/duyuru <mesaj>` – Duyuru yapar. Biçim menüsünde **Kutulu (Embed)** / **Kutusuz (Metin)** seçilir.',
    '  • **Embed**: önce duyuru embed’i, sonra **tek** `@everyone` ping atılır.',
    '  • **Metin**: altta imza + `||@everyone||`, ardından **tek** gerçek `@everyone` ping atılır.',
    '`/dmduyuru <mesaj>` – Sunucudaki herkese DM duyuru gönderir. (Yönetici önerilir)',
  ].join('\n');

  const MOD = [
    '`/ban <kullanici> [sebep]` – Kalıcı ban. DM bilgilendirme + ModLog.',
    '`/unban <kullanici_id> [sebep]` – Ban kaldırma. ModLog.',
    '`/kick <kullanici> [sebep]` – Sunucudan atma. DM + ModLog.',
    '`/timeout <kullanici> <süre(dk)> [sebep]` – Süreli susturma. DM + ModLog.',
    '`/purge <adet>` – 1–100 mesajı toplu siler. (Manage Messages)',
    '`/warn <kullanici> [sebep]` – Kademeli uyarı: 1) 5 dk, 2) 10 dk, 3) 30 dk timeout, 4) **ban**. DM + ModLog.',
    '`/unwarn <kullanici>` – Uyarıyı 1 azaltır.',
    '`/warns <kullanici>` – Toplam uyarıyı gösterir. (ephemeral)',
    '`/warnreset <kullanici>` – Uyarıyı 0’lar.',
  ].join('\n');

  const TICKET = [
    '`/destekgonder` – Ticket panelini yollar (kategori butonları + formlar).',
    '`/ticket-setup` – Açık/Kapalı kategori ile staff/admin/close/delete rollerini ayarlar.',
    '`/ticket-perms` – Ticket yetki rollerini günceller/sıfırlar.',
    '`/ticket-kapat` – İçerideki “Ticketi Kapat” butonunun komut eşleniği.',
    '• Ticket açılınca yalnız **@everyone** pinglenir; rol mention yapılmaz. Oyuncular bot mesajlarını **silemez**.',
    '• Kapatınca **Kapalı** kategoriye taşınır ve **Sil** butonu eklenir.',
  ].join('\n');

  const CEKILIS = [
    '`/cekilis <süre> <ödül> <kazanan_sayısı>` – Butonla katılımlı çekiliş başlatır, her 1 dk’da geri sayım güncellenir.',
    '`/reroll <mesaj_linki|id>` – Belirtilen çekilişte yeni kazanan(lar) seçer.',
  ].join('\n');

  const SUNUCU = [
    '`/odakategori <kategori> [lobi_adi]` – Geçici oda sistemi için kategori ve lobi (Oda Oluştur [+]) kurar.',
    '`/seskanal [kanal]` – Botun 7/24 duracağı ses kanalını ayarlar **ve bağlanır** (self-deaf).',
  ].join('\n');

  const ODA = [
    '`Sistem` – Oyuncu **Oda Oluştur [+]** lobisine girince bot otomatik özel **ses** + **sadece ona açık** komut-kanalı oluşturur; oda boşalınca her ikisi de silinir.',
    '`/voice-owner` – Oda sahibini/kanalı gösterir (yalnızca kendi komut-kanalında).',
    '`/voice-rename <ad>` – Oda adını değiştirir.',
    '`/voice-limit <0-99>` – Kullanıcı limitini ayarlar (0 = sınırsız).',
    '`/voice-lock` / `/voice-unlock` – Bağlanmayı kapat/aç.',
    '`/voice-hide` / `/voice-reveal` – Odayı gizle/görünür yap.',
    '`/voice-kick <üye>` – Üyeyi sesten at.',
    '`/voice-transfer <üye>` – Sahipliği devret (komut-kanalı yetkileri de devreder).',
    '`/voice-claim` – (Opsiyonel) Sahiplik alma senaryosu için yer tutucu.',
    '`/voice-clean` – Boş geçici kanalları temizler (Yönetici).',
    '• Not: **(kullanıcıadı)-oda** komut-kanalında **/purge**, **/ticket-kapat** ve **/durum** kullanılamaz.',
  ].join('\n');

  const ROL = [
    '`/rolmesaj <mesaj>` – Rol paneli mesajını gönderir.',
    '`/rolemoji <mesaj_id> <emoji> <rol>` – Mesajdaki butona/öğeğe rol bağlar **veya günceller**.',
    '`/rolsil <mesaj_id> <rol>` – O mesajdaki ilgili rol seçeneğini kaldırır.',
    '• Kullanıcı butona tıklayınca rol verilir/alınır.',
  ].join('\n');

  // Yardım embed üreticisi
  const pretty = (v) => ({
    genel: 'Genel',
    duyuru: 'Duyuru',
    moderasyon: 'Moderasyon',
    ticket: 'Ticket',
    cekilis: 'Çekiliş',
    sunucu: 'Sunucu',
    oda: 'Oda (Geçici)',
    rol: 'Rol Paneli',
  }[v] ?? v);

  const makeEmbed = (fieldsArr) =>
    new EmbedBuilder()
      .setTitle('📚 Yardım Menüsü')
      .setColor(0x5865f2)
      .setDescription(
        kat
          ? `Kategori: **${pretty(kat)}**`
          : 'Komutlar kategorilere göre listelendi. `@everyone` pingleri tek sefer atılır; gönderilen mesajlarda tekrar ping kapalıdır.\n\nBir kategori için detay: `/help kategori:<adı>`'
      )
      .addFields(fieldsArr)
      .setFooter({ text: 'Zenith Bot • /help' })
      .setTimestamp();

  // Tek kategori istendiyse
  if (kat) {
    const map = {
      genel: [{ name: 'Genel', value: GENEL }],
      duyuru: [{ name: 'Duyuru', value: DUYURU }],
      moderasyon: [{ name: 'Moderasyon', value: MOD }],
      ticket: [{ name: 'Ticket', value: TICKET }],
      cekilis: [{ name: 'Çekiliş', value: CEKILIS }],
      sunucu: [{ name: 'Sunucu', value: SUNUCU }],
      oda: [{ name: 'Oda (Geçici)', value: ODA }],
      rol: [{ name: 'Rol Paneli', value: ROL }],
    };
    const fields = map[kat] ?? [{ name: 'Genel', value: GENEL }];
    const emb = makeEmbed(fields);
    return interaction.reply({ embeds: [emb], flags: MessageFlags.Ephemeral });
  }

  // Hepsi
  const emb = makeEmbed([
    { name: 'Genel', value: GENEL },
    { name: 'Duyuru', value: DUYURU },
    { name: 'Moderasyon', value: MOD },
    { name: 'Ticket', value: TICKET },
    { name: 'Çekiliş', value: CEKILIS },
    { name: 'Sunucu', value: SUNUCU },
    { name: 'Oda (Geçici)', value: ODA },
    { name: 'Rol Paneli', value: ROL },
  ]);

  return interaction.reply({ embeds: [emb], flags: MessageFlags.Ephemeral });
}
