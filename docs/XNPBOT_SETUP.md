# XNPBOT Kurulum ve Başlangıç Rehberi

Bu rehber, VS Code kullanarak Node.js tabanlı Discord botu ve RocketMod tabanlı XNPBOT Unturned plugin'ini hazırlaman için adım adım talimatlar içerir. İlk aşama minimal iskelet ve botun ayağa kalktığı sürümü sağlar; özellikler modüler olarak eklenebilir.

## 1) Node.js yükleme
1. Önerilen sürüm: **Node.js 18 LTS** (örn. 18.20.x).
2. Resmî indirme adresi: <https://nodejs.org/en/download> (Windows x64 Installer veya sistemine uygun paket).
3. Kurulumdan sonra terminalde sürümü doğrula:
```bash
node -v
npm -v
```

## 2) Discord Developer Portal
1. <https://discord.com/developers/applications> adresinde **New Application** oluştur.
2. **Bot** sekmesinde **Add Bot** → **Reset Token** ile token al ve `.env` dosyanda `DISCORD_TOKEN` olarak sakla.
3. **Privileged Gateway Intents**: `SERVER MEMBERS INTENT` ve `MESSAGE CONTENT INTENT` gerekli olduğundan açık hale getir.
4. **OAuth2 → URL Generator**:
   - Scopes: `applications.commands`, `bot`
   - Bot Permissions: `Administrator` (geliştirme için hızlı), prod’da minimum yetkileri seçebilirsin.
   - Üretilen URL ile botu test sunucuna ekle.

## 3) VS Code ile Discord botu projesi
1. Yeni klasör aç: `xnpbot/discord-bot` (repo içinde mevcut).
2. VS Code'da klasörü aç ve terminali kullan:
```bash
cd xnpbot/discord-bot
npm init -y
npm install discord.js mysql2 dotenv express
npm install -D nodemon
```
3. `.env` dosyasını oluştur (örn. `xnpbot/discord-bot/.env`):
```env
DISCORD_TOKEN=BOT_TOKENIN
CLIENT_ID=BOT_CLIENT_ID
GUILD_ID=GELISTIRME_SUNUCUSU_ID
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=supersecret
MYSQL_DATABASE=xnpbot
API_SECRET=degistirilmis-guvenli-anahtar
PORT=3000
```
4. Örnek config dosyaları `src/config/*.example.json` altında hazır; kendi değerlerini kopyalayıp düzenleyebilirsin.
5. Klasör şeması (ilk iskelet):
```
src/
  index.js               # giriş
  commands/              # slash komutları
  events/                # event dinleyicileri
  features/status/       # durum mesajı döngüsü
  services/              # loader, db, config, http api
  config/                # log/rol/status/link mesajları için örnek json
  translations/          # en/tr mesajlar
  scripts/deploy-commands.js
sql/schema.sql           # MySQL tablo şeması
```
6. Slash komutları kaydetmek için (geliştirme sunucuna):
```bash
node src/scripts/deploy-commands.js
```
7. Botu çalıştır:
```bash
npm start
```

## 4) Unturned / XNPBOT plugin projesi (Visual Studio 2022)
1. **New Project** → **Class Library (.NET Framework)** → Framework: **.NET Framework 4.7.2** → Proje adı `XNPBOT`.
2. Solution içinde klasör yapısı:
```
XNPBOT/
  Main.cs
  Configuration/
    XNPBOTConfiguration.cs
    DiscordLogChannelDefinition.cs
  Models/
    LinkCode.cs
    PermissionGrant.cs
  Services/
    HttpService.cs
    LogForwardingService.cs
    PermissionGrantService.cs
    LinkService.cs
  Translations/
    en.xml
    tr.xml
```
3. Gerekli referanslar: `Rocket.Unturned.dll`, `SDG.Unturned.dll`, `Rocket.Core.dll` (Unturned sunucu dizinindeki `Modules` veya `Rocket` klasöründen ekle).
4. **Build** çıktısını otomatik kopyalamak için: Proje özellikleri → Build Events → Post-build event: `copy /Y "$(TargetPath)" "C:\\Unturned\\Servers\\SunucuAdi\\Rocket\\Plugins\\"` (yola göre düzenle).
5. `XNPBOT.configuration.xml` ve `Translations/tr.xml` dosyalarını `Unturned/Servers/<isim>/Rocket/Plugins/XNPBOT/` klasörüne yerleştir.

## 5) Dosya bazlı iskelet kodlar
Aşağıdaki dosyalar repo içinde hazır. VS Code’da belirtilen yolları izleyerek aynı isimle oluşturabilir ve içerikleri yapıştırabilirsin.

### Discord botu
- `xnpbot/discord-bot/src/index.js`: Bot giriş noktası; config yükler, komut/event’leri otomatik kaydeder, Express tabanlı HTTP API’yi başlatır.
- `xnpbot/discord-bot/src/services/loader.js`: Komut ve event loader.
- `xnpbot/discord-bot/src/services/database.js`: MySQL bağlantı havuzu.
- `xnpbot/discord-bot/src/services/httpServer.js`: `/api/log`, `/api/status`, `/api/grantPermission` uçları; `API_SECRET` ile korumalı.
- `xnpbot/discord-bot/src/services/config.js`: JSON config ve translation dosyalarını okur.
- `xnpbot/discord-bot/src/commands/ping.js`: Örnek ping komutu.
- `xnpbot/discord-bot/src/commands/link.js`: Steam–Discord linkleme için temel slash komutu (MySQL kontrolleri ile).
- `xnpbot/discord-bot/src/events/ready.js`, `interactionCreate.js`, `guildMemberAdd.js`: Temel event örnekleri (otorol vb.).
- `xnpbot/discord-bot/src/features/status/poller.js`: Durum mesajı güncelleme döngüsü için iskelet.
- `xnpbot/discord-bot/src/scripts/deploy-commands.js`: Slash komut kayıt scripti.
- `xnpbot/discord-bot/sql/schema.sql`: Tüm gerekli tabloların oluşturma scriptleri.

### XNPBOT plugin (RocketMod)
- `xnpbot/unturned-plugin/XNPBOT/Main.cs`: Plugin giriş noktası; config/translation yükler ve event aboneliği için iskelet.
- `xnpbot/unturned-plugin/XNPBOT/Configuration/XNPBOTConfiguration.cs`: API, log kanalları, durum mesajı ve link ayarları için model.
- `xnpbot/unturned-plugin/XNPBOT/Configuration/DiscordLogChannelDefinition.cs`: Log kanal map modeli.
- `xnpbot/unturned-plugin/XNPBOT/Models/LinkCode.cs`, `PermissionGrant.cs`: Veri modelleri.
- `xnpbot/unturned-plugin/XNPBOT/Services/HttpService.cs`, `LogForwardingService.cs`, `PermissionGrantService.cs`, `LinkService.cs`: HTTP haberleşme, log iletme, yetki verme ve link kod yönetimi için temel sınıflar.
- `xnpbot/unturned-plugin/XNPBOT/Translations/tr.xml`: Türkçe çeviri örneği.

## 6) Sonraki adımlar (özellikleri genişletme)
- Moderasyon komutları `/ban`, `/kick`, `/timeout`, `/clear` vb. için `commands/` klasörüne yeni dosyalar ekleyip `moderatorRoles` kontrolü yap.
- Ticket paneli ve butonları için `features/` altında yeni modül oluştur; config’teki mesaj ve buton etiketlerini kullan.
- Log forwarding: `httpServer.js` içindeki `/api/log` uç noktasında payload’a göre ilgili kanala embed gönder.
- Market ve kredi işlemleri için `/krediver`, `/kredi`, `/marketekle` komutlarını ekleyerek `sql/schema.sql` tablolarını kullan.
- Durum mesajı için `features/status/poller.js` içindeki `fetchStatus` fonksiyonunu XNPBOT’tan gelen veriyi kullanacak şekilde doldur.
- Steam–Discord link süreci için `link.js` komutunda `messages.example.json` ve `linkConfig.example.json` değerlerini okuyarak ödül/duyuru akışını tamamla.

Bu rehber, tüm dosya yollarını ve ilk çalışır iskeleti sağlar; VS Code’da ilgili klasör ve dosyaları oluşturarak kodu yapıştırıp özelleştirebilirsin.
