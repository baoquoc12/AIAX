const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

let configPath = null;
let configCache = null;

function setConfigPath(cfg) {
  const paths = [
    path.join(process.cwd(), 'configs', 'config.yaml'),
    path.join(process.cwd(), 'config.yaml'),
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      configPath = p;
      return p;
    }
  }
  return null;
}

function getLanguage(cfg) {
  return cfg?.app?.language || 'en';
}

function updateLanguage(cfg, log, language) {
  if (!['zh', 'en', 'vi'].includes(language)) {
    return { ok: false, error: 'Only zh, en, or vi are supported' };
  }
  if (!cfg.app) cfg.app = {};
  cfg.app.language = language;
  setConfigPath(cfg);
  if (configPath) {
    try {
      const current = yaml.load(fs.readFileSync(configPath, 'utf8')) || {};
      if (!current.app) current.app = {};
      current.app.language = language;
      fs.writeFileSync(configPath, yaml.dump(current, { lineWidth: -1 }), 'utf8');
    } catch (err) {
      log.warnw('Failed to write config file', { error: err.message });
    }
  }
  log.infow('System language updated', { language });
  return { ok: true, language };
}

/**
 * Read a key from global_settings, parse its stored value, and return defaultValue when missing.
 */
function getGlobalSetting(db, key, defaultValue = null) {
  try {
    const row = db.prepare('SELECT value FROM global_settings WHERE key = ?').get(key);
    if (!row) return defaultValue;
    try { return JSON.parse(row.value); } catch (_) { return row.value; }
  } catch (_) { return defaultValue; }
}

/**
 * Write a key to global_settings. Values are stored with JSON.stringify.
 */
function setGlobalSetting(db, key, value) {
  const now = new Date().toISOString();
  const str = JSON.stringify(value);
  db.prepare(
    `INSERT INTO global_settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  ).run(key, str, now);
}

module.exports = {
  setConfigPath,
  getLanguage,
  updateLanguage,
  getGlobalSetting,
  setGlobalSetting,
};
