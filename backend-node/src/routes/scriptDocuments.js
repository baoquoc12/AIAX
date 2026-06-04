const response = require('../response');
const scriptDocumentService = require('../services/scriptDocumentService');

module.exports = function scriptDocumentRoutes(db, log) {
  return {
    list: (req, res) => {
      try {
        const items = scriptDocumentService.list(db, { ...req.query, drama_id: req.params.id });
        response.success(res, { items });
      } catch (err) {
        log.error('script documents list', { error: err.message });
        response.internalError(res, err.message);
      }
    },
    latest: (req, res) => {
      try {
        const items = scriptDocumentService.latestByType(db, req.params.id, req.query.episode_id || 0);
        response.success(res, { items });
      } catch (err) {
        log.error('script documents latest', { error: err.message });
        response.internalError(res, err.message);
      }
    },
    create: (req, res) => {
      try {
        const item = scriptDocumentService.create(db, log, { ...(req.body || {}), drama_id: req.params.id });
        response.created(res, item);
      } catch (err) {
        log.error('script documents create', { error: err.message });
        response.internalError(res, err.message);
      }
    },
    update: (req, res) => {
      try {
        const item = scriptDocumentService.update(db, log, req.params.doc_id, req.body || {});
        if (!item) return response.notFound(res, 'script document not found');
        response.success(res, item);
      } catch (err) {
        log.error('script documents update', { error: err.message });
        response.internalError(res, err.message);
      }
    },
  };
};
