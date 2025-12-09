const fs = require('fs');
const path = require('path');

async function loadCommands(client, dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const fullPath = path.join(dir, file.name);
    if (file.isDirectory()) {
      await loadCommands(client, fullPath);
      continue;
    }
    if (!file.name.endsWith('.js')) continue;
    const command = require(fullPath);
    if (!command.data || !command.execute) continue;
    client.commands.set(command.data.name, command);
  }
}

function loadEvents(dir) {
  const events = [];
  if (!fs.existsSync(dir)) return events;
  const files = fs.readdirSync(dir).filter((file) => file.endsWith('.js'));
  for (const file of files) {
    const event = require(path.join(dir, file));
    if (!event.name || !event.execute) continue;
    events.push(event);
  }
  return events;
}

module.exports = { loadCommands, loadEvents };
