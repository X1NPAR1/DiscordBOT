# Zenith Discord Bot

> Yapımcı: **XINPARI**  
> Modern moderasyon + ticket + geçici ses odası + rol paneli + çekiliş + durum ve daha fazlası.  
> Dil: Node.js (ESM) • discord.js v14

---

## 🚀 Hızlı Başlangıç

### 1) Gerekli kurulum
```bash
# Node 18+ önerilir
npm install
```

### 2) .env dosyasını oluştur
Proje köküne `.env` oluştur ve aşağıdakileri doldur:

```
TOKEN=BOT_TOKENIN
CLIENT_ID=BOTUN_UYGULAMA_IDSI
GUILD_ID=TEST_SUNUCU_IDSI

# Yayın (mor) durum yazıları
SERVER_IP=185.193.165.88
SERVER_PORT=27015
STREAM_URL=https://twitch.tv/twitch

# Mod log kanalı (opsiyonel ama tavsiye edilir)
MODLOG_CHANNEL_ID=KANAL_ID

# Otorol (opsiyonel)
AUTOROLE_ID=ROL_ID

# CS durum komutu
CS_HOST=SUNUCU_IP
CS_PORT=27015
CS_QUERY_PORT=27015
CS_GAME=cs2          # cs2 veya csgo
CS_NAME=Zenith Gaming Pro Public

# 7/24 seste durma (opsiyonel - komutla da ayarlanır)
STAY_VOICE_CHANNEL_ID=SES_KANAL_ID
```

### 3) Slash komutları kaydet
```bash
node src/register-commands.js
```

### 4) Çalıştır
```bash
npm start
```

> Windows için `start.bat` kullanıyorsan aynı dizinde `.env` olmalı.

---

## 📦 Klasör Yapısı (özet)
```
src/
  app.js                 # bot ana dosya
  register-commands.js   # slash kayıt
  lib/
    store.js             # kalıcı json veritabanı
    modlog.js            # modlog yardımcıları
    parseDuration.js     # 1h / 2d / 1w formatları
    giveawayStore.js     # çekiliş bellek içi kayıt
  tickets/handlers.js    # ticket sistemi
  voice/manager.js       # geçici odalar
  voice/stay.js          # 7/24 seste kal
  roles/handler.js       # rol panel buton dinleyici
  commands/              # tüm /komutlar
```

---

## 🧩 Özellikler & Kullanım

### 1) Moderasyon
- `/ban @üye [sebep]`
- `/kick @üye [sebep]`
- `/timeout @üye süre(dk) [sebep]`
- `/warn @üye [sebep]` → 1. uyarı: 5 dk, 2: 10 dk, 3: 30 dk timeout, 4: kalıcı ban  
- `/unwarn @üye` → uyarı sayısını bir düşürür
- `/purge adet` → 1–100 mesaj sil

**ModLog:** `.env` içinde `MODLOG_CHANNEL_ID` tanımlarsan tüm işlemler embed olarak oraya da düşer.  
**DM:** Kullanıcıya bilgilendirme DM’i gönderilir (kapalı ise atlanır).

### 2) Ticket Sistemi
- `/destekgonder` → kategori butonlu paneli yollar
- `/ticket-setup` → açık/kapalı kategori + roller
- `/ticket-perms` → kapatma/silme/staff/admin rolleri
- `/ticket-kapat` → mevcut ticket’ı kapatır

> Açılan ticketlarda yalnız **@everyone** pinglenir; rol mention yoktur. Kapanınca **kapalı kategoriye** taşınır ve **Sil** butonu çıkar.

### 3) Geçici Ses Odaları
- `/odakategori kategori:[Kategori] [lobi_adi]` → örn: **Oda Oluştur [+]** lobisi
- Oyuncu lobiye girince bot otomatik:
  - özel **ses kanalı** + yalnız sahibine açık **komut metin kanalı** açar
  - kanal boşalınca ikisini de siler
- Oda içi komutlar (sadece kendi komut-kanalında çalışır):
  - `/voice-owner`, `/voice-rename`, `/voice-limit`
  - `/voice-lock`, `/voice-unlock`, `/voice-hide`, `/voice-reveal`
  - `/voice-kick @üye`, `/voice-transfer @üye`, `/voice-claim`, `/voice-clean`

### 4) 7/24 Ses Kanalında Kalma
- `/seskanal [kanal]` → botu seçili/olduğun ses kanalına bağlar ve kalıcı ayarlar
- Bot her bağlanışta **self-deaf + self-mute** kalır
- `.env` ile varsayılan: `STAY_VOICE_CHANNEL_ID`

### 5) Rol Paneli (Butonla Rol Alma)
- `/rolmesaj <metin>` → panel mesajını yollar (butonsuz)
- `/rolemoji mesajid:<id> emoji:<emoji> rol:@rol` → butonu ekler/günceller
- `/rolemoji-sil mesajid:<id> rol:@rol` → sadece o rolu kaldırır
- Kullanıcı butona tıklayınca rol verilir/geri alınır

### 6) Çekiliş
- `/cekilis sure:<10m|2h|1d|1w> odul:<metin> kazanansayisi:<n>`
- Embed her **15 saniyede bir** güncellenir  
- Kalan süre formatı:  
  - **≥ 1 gün:** `X gün Y saat Z dk`  
  - **< 1 gün:** `H saat MM dk SS sn`
- Süre bitince kazanan(lar) açıklanır

### 7) Sunucu Durumu (CS:GO/CS2)
- `/durum` → yalnızca özel oda metin kanalı dışında herkes kullanabilir
- `.env`: `CS_HOST`, `CS_PORT`, `CS_QUERY_PORT`, `CS_GAME`, `CS_NAME`
- `npm i gamedig` kurulu olmalı

### 8) Otorol & Küfür Filtresi
- Otorol: `.env` `AUTOROLE_ID` veya `/ticket-setup` sonrası store’dan
- Küfür filtresi: `store.json > config.swear` içinden aç/kapat + özel kelimeler

### 9) Yayında (Mor) Durum Döngüsü
- Bot açıldığında 30 sn’de bir şu metinler döner:
  - `En iyi CS:GO sunucusu`
  - `IP: <SERVER_IP> • Port: <SERVER_PORT>`
  - `Sende sunucumuza gel ve tadını çıkar!`
- Yayın moru için `STREAM_URL` **geçerli bir yayın linki** olmalı

---

## 🛠 Hosting (Pterodactyl / Bot-Hosting)
1. Dosyaları panele yükle
2. **Start Command** / **BOT_JS_FILE** → `src/app.js`
3. `node src/register-commands.js` komutunu en az bir kere çalıştır
4. `.env` değerlerini panelden ekle
5. Başlat

---

## ❓ SSS / Sorun Giderme

- **Komutlar görünmüyor** → `node src/register-commands.js` (GUILD_ID doğru mu?)  
- **Ban/Kick yetki hatası** → Bot rolünü hedef rolün üstüne taşı, `Ban/Kick Members` ver.  
- **Durum komutu çalışmıyor** → `npm i gamedig`, firewall’da A2S (UDP) engelli olabilir.  
- **Seste kalmıyor** → `STAY_VOICE_CHANNEL_ID` ayarlı mı? Kanalı silmiş olabilir; `/seskanal` ile tekrar ayarla.  
- **Uygulama yanıt vermedi** → Eşzamanlı ağır işlemlerden kaçın, komutta `deferReply` kullanılmış olmalı.

---

## 📜 Lisans
Bu proje topluluk kullanımınadır. İsimlendirme/marka: **XINPARI**.
