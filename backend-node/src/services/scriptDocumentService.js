function parseJson(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch (_) { return fallback; }
}

function rowToDocument(row) {
  if (!row) return null;
  return { ...row, metadata: parseJson(row.metadata, {}) };
}

function list(db, query = {}) {
  const did = Number(query.drama_id);
  if (!did) throw new Error('drama_id required');
  const clauses = ['drama_id = ?', 'deleted_at IS NULL'];
  const params = [did];
  if (query.episode_id != null && query.episode_id !== '') {
    clauses.push('episode_id = ?');
    params.push(Number(query.episode_id) || 0);
  }
  if (query.doc_type) {
    clauses.push('doc_type = ?');
    params.push(String(query.doc_type));
  }
  const rows = db.prepare(`
    SELECT * FROM script_documents
    WHERE ${clauses.join(' AND ')}
    ORDER BY doc_type ASC, version DESC, id DESC
  `).all(...params);
  return rows.map(rowToDocument);
}

function latestByType(db, dramaId, episodeId = 0) {
  const rows = db.prepare(`
    SELECT * FROM script_documents
    WHERE drama_id = ? AND episode_id = ? AND deleted_at IS NULL
    ORDER BY doc_type ASC, version DESC, id DESC
  `).all(Number(dramaId), Number(episodeId) || 0).map(rowToDocument);
  const out = {};
  for (const row of rows) {
    if (!out[row.doc_type]) out[row.doc_type] = row;
  }
  return out;
}

function create(db, log, req = {}) {
  const did = Number(req.drama_id);
  if (!did) throw new Error('drama_id required');
  const episodeId = Number(req.episode_id) || 0;
  const docType = String(req.doc_type || '').trim();
  if (!docType) throw new Error('doc_type required');
  const max = db.prepare(`
    SELECT MAX(version) AS v FROM script_documents
    WHERE drama_id = ? AND episode_id = ? AND doc_type = ? AND deleted_at IS NULL
  `).get(did, episodeId, docType)?.v || 0;
  const version = Number(req.version) || Number(max) + 1;
  const now = new Date().toISOString();
  const info = db.prepare(`
    INSERT INTO script_documents
      (drama_id, episode_id, doc_type, title, content, version, status, score, source, metadata, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    did,
    episodeId,
    docType,
    req.title || docType,
    req.content || '',
    version,
    req.status || 'draft',
    req.score == null ? null : Number(req.score),
    req.source || 'prompt_engine',
    JSON.stringify(req.metadata || {}),
    now,
    now
  );
  log?.info?.('Script document created', { id: info.lastInsertRowid, drama_id: did, doc_type: docType, version });
  return getById(db, info.lastInsertRowid);
}

function update(db, log, id, req = {}) {
  const row = getById(db, id);
  if (!row) return null;
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE script_documents
    SET title = ?, content = ?, status = ?, score = ?, source = ?, metadata = ?, updated_at = ?
    WHERE id = ?
  `).run(
    req.title ?? row.title ?? '',
    req.content ?? row.content ?? '',
    req.status ?? row.status ?? 'draft',
    req.score == null ? row.score : Number(req.score),
    req.source ?? row.source ?? 'prompt_engine',
    JSON.stringify(req.metadata || row.metadata || {}),
    now,
    Number(id)
  );
  log?.info?.('Script document updated', { id: Number(id) });
  return getById(db, id);
}

function getById(db, id) {
  return rowToDocument(db.prepare('SELECT * FROM script_documents WHERE id = ? AND deleted_at IS NULL').get(Number(id)));
}

module.exports = { list, latestByType, create, update, getById };
