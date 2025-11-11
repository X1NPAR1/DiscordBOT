export function parseDuration(input) {
  // destek: 30s, 10m, 2h, 3d
  const m = String(input).trim().match(/^(\d{1,5})\s*(s|m|h|d)$/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  const mult = unit === 's' ? 1000 : unit === 'm' ? 60000 : unit === 'h' ? 3600000 : 86400000;
  return n * mult;
}
