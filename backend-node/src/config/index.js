const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const configPaths = [
  path.join(process.cwd(), 'configs', 'config.yaml'),
  path.join(process.cwd(), 'config.yaml'),
  path.join(__dirname, '..', '..', 'configs', 'config.yaml'),
];

function loadConfig() {
  let raw = null;
  for (const p of configPaths) {
    if (fs.existsSync(p)) {
      raw = fs.readFileSync(p, 'utf8');
      break;
    }
  }
  if (!raw) {
    throw new Error('Config file not found: configs/config.yaml');
  }
  const parsed = yaml.load(raw);
  if (!parsed?.app?.name) {
    throw new Error('Invalid config: missing app section');
  }
  return applyEnvOverrides(parsed);
}

function envBool(name) {
  const value = process.env[name];
  if (value == null || value === '') return undefined;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function envList(name) {
  const value = process.env[name];
  if (value == null || value === '') return undefined;
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function applyEnvOverrides(config) {
  const next = {
    ...config,
    server: { ...(config.server || {}) },
    database: { ...(config.database || {}) },
    storage: { ...(config.storage || {}) },
    video: { ...(config.video || {}) },
  };

  if (process.env.APP_LANGUAGE) next.app = { ...(next.app || {}), language: process.env.APP_LANGUAGE };
  if (process.env.SERVER_HOST) next.server.host = process.env.SERVER_HOST;
  if (process.env.CORS_ORIGINS) next.server.cors_origins = envList('CORS_ORIGINS');
  const insecureTls = envBool('INSECURE_TLS');
  if (insecureTls !== undefined) next.server.insecure_tls = insecureTls;

  if (process.env.DATABASE_PATH) next.database.path = process.env.DATABASE_PATH;
  if (process.env.STORAGE_LOCAL_PATH) next.storage.local_path = process.env.STORAGE_LOCAL_PATH;

  const publicBaseUrl = process.env.PUBLIC_BASE_URL || process.env.RENDER_EXTERNAL_URL;
  if (process.env.STORAGE_BASE_URL) {
    next.storage.base_url = process.env.STORAGE_BASE_URL.replace(/\/$/, '');
  } else if (publicBaseUrl) {
    next.storage.base_url = publicBaseUrl.replace(/\/$/, '') + '/static';
  }

  if (process.env.VIDEO_GENERATION_TIMEOUT_MINUTES) {
    const minutes = Number(process.env.VIDEO_GENERATION_TIMEOUT_MINUTES);
    if (Number.isFinite(minutes) && minutes > 0) next.video.generation_timeout_minutes = minutes;
  }

  return next;
}

module.exports = { loadConfig };
