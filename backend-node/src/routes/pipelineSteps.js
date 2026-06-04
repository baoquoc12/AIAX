const response = require('../response');
const pipelineStepService = require('../services/pipelineStepService');

module.exports = function pipelineStepRoutes(db, log) {
  return {
    list: (req, res) => {
      try {
        const items = pipelineStepService.list(db, log, req.params.id, req.query.episode_id || 0);
        response.success(res, { items });
      } catch (err) {
        log.error('pipeline steps list', { error: err.message });
        response.internalError(res, err.message);
      }
    },
    upsert: (req, res) => {
      try {
        const item = pipelineStepService.upsert(db, log, req.params.id, req.params.step_key, req.body || {}, req.body?.episode_id || 0);
        response.success(res, item);
      } catch (err) {
        log.error('pipeline steps upsert', { error: err.message });
        response.internalError(res, err.message);
      }
    },
  };
};
