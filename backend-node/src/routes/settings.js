const settingsService = require('../services/settingsService');
const response = require('../response');
const { loadConfig } = require('../config');
const { resolveVideoGenerationTimeoutMinutes } = require('../config/videoGeneration');

function getLanguage(cfg) {
  return (req, res) => {
    const language = settingsService.getLanguage(cfg);
    response.success(res, { language });
  };
}

function updateLanguage(cfg, log) {
  return (req, res) => {
    const lang = req.body?.language;
    if (!['zh', 'en', 'vi'].includes(lang)) {
      return response.badRequest(res, 'Invalid language. Only zh, en, or vi are supported');
    }
    const out = settingsService.updateLanguage(cfg, log, lang);
    if (!out.ok) return response.badRequest(res, out.error);
    const message = lang === 'vi' ? 'Language switched to Vietnamese' : lang === 'en' ? 'Language switched to English' : 'Language switched to Chinese';
    response.success(res, { message, language: lang });
  };
}

/** GET /settings/generation - read global generation settings */
function getGenerationSettings(db) {
  return (req, res) => {
    const concurrency = settingsService.getGlobalSetting(db, 'pipeline_concurrency', 3);
    const video_concurrency = settingsService.getGlobalSetting(db, 'pipeline_video_concurrency', 3);
    const video_generation_timeout_minutes = resolveVideoGenerationTimeoutMinutes(loadConfig());
    response.success(res, { concurrency, video_concurrency, video_generation_timeout_minutes });
  };
}

/** PUT /settings/generation - update global generation settings */
function updateGenerationSettings(db) {
  return (req, res) => {
    const { concurrency, video_concurrency } = req.body || {};
    if (concurrency !== undefined) {
      const n = Number(concurrency);
      if (!Number.isInteger(n) || n < 1 || n > 20) {
        return response.badRequest(res, 'Image concurrency must be an integer from 1 to 20');
      }
      settingsService.setGlobalSetting(db, 'pipeline_concurrency', n);
    }
    if (video_concurrency !== undefined) {
      const n = Number(video_concurrency);
      if (!Number.isInteger(n) || n < 1 || n > 20) {
        return response.badRequest(res, 'Video concurrency must be an integer from 1 to 20');
      }
      settingsService.setGlobalSetting(db, 'pipeline_video_concurrency', n);
    }
    const saved = settingsService.getGlobalSetting(db, 'pipeline_concurrency', 3);
    const saved_video = settingsService.getGlobalSetting(db, 'pipeline_video_concurrency', 3);
    const video_generation_timeout_minutes = resolveVideoGenerationTimeoutMinutes(loadConfig());
    response.success(res, {
      concurrency: saved,
      video_concurrency: saved_video,
      video_generation_timeout_minutes,
    });
  };
}

module.exports = function settingsRoutes(db, cfg, log) {
  return {
    getLanguage: getLanguage(cfg),
    updateLanguage: updateLanguage(cfg, log),
    getGenerationSettings: getGenerationSettings(db),
    updateGenerationSettings: updateGenerationSettings(db),
  };
};
