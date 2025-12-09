const fs = require('fs');
const path = require('path');

function loadJson(file) {
  const target = path.join(__dirname, '..', 'config', file);
  if (!fs.existsSync(target)) return {};
  return JSON.parse(fs.readFileSync(target, 'utf8'));
}

function loadConfig() {
  return {
    logChannels: loadJson('logChannels.example.json'),
    roles: loadJson('roles.example.json'),
    status: loadJson('statusConfig.example.json'),
    messages: loadJson('messages.example.json'),
    link: loadJson('linkConfig.example.json'),
    translations: {
      en: loadJson('../translations/en.json'),
      tr: loadJson('../translations/tr.json')
    }
  };
}

module.exports = { loadConfig };
