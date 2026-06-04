const DEFAULT_STEPS = [
  { step_key: 'script_lock', title: 'Script Lock' },
  { step_key: 'storyboard_lock', title: 'Storyboard Lock' },
  { step_key: 'test_shots', title: 'Test Shots' },
  { step_key: 'shot_qc', title: 'Shot QC' },
  { step_key: 'picture_lock', title: 'Picture Lock' },
  { step_key: 'signoff', title: 'Sign-off' },
];

function parseJson(value, fallback = {}) {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch (_) { return fallback; }
}

function rowToStep(row) {
  if (!row) return null;
  return {
    ...row,
    metadata: parseJson(row.metadata, {}),
  };
}

function getDramaMetadata(db, dramaId) {
  const row = db.prepare('SELECT metadata FROM dramas WHERE id = ? AND deleted_at IS NULL').get(Number(dramaId));
  return parseJson(row?.metadata, {});
}

function seedDefaultsIfNeeded(db, log, dramaId, episodeId = 0) {
  const did = Number(dramaId);
  const eid = Number(episodeId) || 0;
  const count = db.prepare('SELECT COUNT(*) AS c FROM pipeline_steps WHERE drama_id = ? AND episode_id = ? AND deleted_at IS NULL').get(did, eid)?.c || 0;
  if (count > 0) return;

  const metaPipeline = getDramaMetadata(db, did)?.step_data?.aiax_pipeline || {};
  const gates = metaPipeline.gates || {};
  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO pipeline_steps
      (drama_id, episode_id, step_key, title, status, note, metadata, completed_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const tx = db.transaction(() => {
    for (const step of DEFAULT_STEPS) {
      const old = gates[step.step_key] || {};
      const status = old.status || 'pending';
      insert.run(
        did,
        eid,
        step.step_key,
        step.title,
        status,
        old.note || '',
        JSON.stringify({ migrated_from_metadata: !!gates[step.step_key] }),
        status === 'done' || status === 'waived' ? (old.updated_at || now) : null,
        now,
        old.updated_at || now
      );
    }
  });
  tx();
  log?.info?.('Pipeline steps seeded', { drama_id: did, episode_id: eid });
}

function list(db, log, dramaId, episodeId = 0) {
  seedDefaultsIfNeeded(db, log, dramaId, episodeId);
  return db.prepare(`
    SELECT * FROM pipeline_steps
    WHERE drama_id = ? AND episode_id = ? AND deleted_at IS NULL
    ORDER BY id ASC
  `).all(Number(dramaId), Number(episodeId) || 0).map(rowToStep);
}

function upsert(db, log, dramaId, stepKey, req = {}, episodeId = 0) {
  seedDefaultsIfNeeded(db, log, dramaId, episodeId);
  const did = Number(dramaId);
  const eid = Number(req.episode_id ?? episodeId) || 0;
  const key = String(stepKey || req.step_key || '').trim();
  if (!key) throw new Error('step_key required');
  const now = new Date().toISOString();
  const existing = db.prepare('SELECT * FROM pipeline_steps WHERE drama_id = ? AND episode_id = ? AND step_key = ? AND deleted_at IS NULL').get(did, eid, key);
  const status = req.status || existing?.status || 'pending';
  const completedAt = (status === 'done' || status === 'waived') ? (req.completed_at || existing?.completed_at || now) : null;
  const metadata = JSON.stringify(req.metadata || parseJson(existing?.metadata, {}));

  if (existing) {
    db.prepare(`
      UPDATE pipeline_steps
      SET title = ?, status = ?, note = ?, approved_by = ?, metadata = ?, completed_at = ?, updated_at = ?
      WHERE id = ?
    `).run(
      req.title ?? existing.title ?? '',
      status,
      req.note ?? existing.note ?? '',
      req.approved_by ?? existing.approved_by ?? null,
      metadata,
      completedAt,
      now,
      existing.id
    );
  } else {
    db.prepare(`
      INSERT INTO pipeline_steps
        (drama_id, episode_id, step_key, title, status, note, approved_by, metadata, completed_at, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(did, eid, key, req.title || key, status, req.note || '', req.approved_by || null, metadata, completedAt, now, now);
  }
  log?.info?.('Pipeline step saved', { drama_id: did, episode_id: eid, step_key: key, status });
  return db.prepare('SELECT * FROM pipeline_steps WHERE drama_id = ? AND episode_id = ? AND step_key = ? AND deleted_at IS NULL').get(did, eid, key);
}

module.exports = { DEFAULT_STEPS, list, upsert };
