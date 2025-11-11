// src/lib/store.js
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'tickets.json');

// Varsayılan şema
const DEFAULT_DB = {
  config: {
    // ticket config
    openCategoryId: null,
    closedCategoryId: null,
    staffRoleId: null,
    adminRoleId: null,
    closeRoleId: null,      // kapatma yetkisi ek rol
    deleteRoleId: null,     // silme yetkisi ek rol

    // Geçici oda (voice) sistemi
    tempVoiceCategoryId: null,
    tempVoiceLobbyName: 'Oda Oluştur [+]',

    // Otorol (komutla set edilebilir)
    autoroleId: null,

    // Küfür filtresi ayarları
    swear: {
      enabled: true,
      family: true,
      religion: true,
      national: true,
      custom: [], // adminin ekledikleri
    },

    // Kalıcı ses kanalı (iki anahtar da desteklenir)
    stayVoiceChannelId: null,   // mevcut dosyandaki isim
    voiceStayChannelId: null,   // helper'ın kullandığı isim
  },

  nextNumber: 1,

  // aktif ticketlar (tip -> kayıt)
  active: {
    'ban-itiraz': {},
    'oyuncu-sikayet': {},
  },

  // ownerId -> { voiceId, textId, guildId, createdAt }
  tempVoice: {},

  // uyarılar: guildId -> userId -> count
  warnings: {},

  // rol panel: messageId -> { guildId, roles:[{roleId,label,emoji}] }
  rolePanels: {},
};

// Dosyayı oluştur (tek yer burası)
function initFile() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(FILE)) {
    writeFileSync(FILE, JSON.stringify(DEFAULT_DB, null, 2));
  }
}

// Eksik alanları tamamla (migrasyon)
function normalize(db) {
  let changed = false;

  // temel obje yoksa
  if (typeof db !== 'object' || db === null) {
    Object.assign(db, DEFAULT_DB);
    return true;
  }

  // config
  db.config ??= {};
  for (const [k, v] of Object.entries(DEFAULT_DB.config)) {
    if (!(k in db.config)) { db.config[k] = v; changed = true; }
  }

  // ❗ kalıcı ses alanlarında geriye dönük uyum
  // stayVoiceChannelId varsa, voiceStayChannelId'a yansıt
  if (db.config.stayVoiceChannelId && !db.config.voiceStayChannelId) {
    db.config.voiceStayChannelId = db.config.stayVoiceChannelId; changed = true;
  }
  // tersi de olabilir
  if (db.config.voiceStayChannelId && !db.config.stayVoiceChannelId) {
    db.config.stayVoiceChannelId = db.config.voiceStayChannelId; changed = true;
  }

  // nextNumber
  if (typeof db.nextNumber !== 'number' || !Number.isFinite(db.nextNumber)) {
    db.nextNumber = DEFAULT_DB.nextNumber; changed = true;
  }

  // active
  db.active ??= {};
  for (const key of Object.keys(DEFAULT_DB.active)) {
    if (!(key in db.active)) { db.active[key] = {}; changed = true; }
  }

  // tempVoice / warnings / rolePanels
  db.tempVoice   ??= {};
  db.warnings    ??= {};
  db.rolePanels  ??= {};

  return changed;
}

export function loadStore() {
  initFile();
  const db = JSON.parse(readFileSync(FILE, 'utf8'));
  if (normalize(db)) {
    writeFileSync(FILE, JSON.stringify(db, null, 2));
  }
  return db;
}

export function saveStore(obj) {
  initFile();
  const db = JSON.parse(JSON.stringify(obj)); // clone
  normalize(db);
  writeFileSync(FILE, JSON.stringify(db, null, 2));
}
