CREATE TABLE IF NOT EXISTS pipeline_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  drama_id INTEGER NOT NULL,
  episode_id INTEGER DEFAULT 0,
  step_key TEXT NOT NULL,
  title TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  note TEXT,
  approved_by TEXT,
  metadata TEXT,
  completed_at TEXT,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT,
  UNIQUE(drama_id, episode_id, step_key)
);

CREATE INDEX IF NOT EXISTS idx_pipeline_steps_drama ON pipeline_steps(drama_id, episode_id, deleted_at);

CREATE TABLE IF NOT EXISTS script_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  drama_id INTEGER NOT NULL,
  episode_id INTEGER DEFAULT 0,
  doc_type TEXT NOT NULL,
  title TEXT DEFAULT '',
  content TEXT,
  version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft',
  score INTEGER,
  source TEXT DEFAULT 'prompt_engine',
  metadata TEXT,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_script_documents_drama ON script_documents(drama_id, episode_id, doc_type, deleted_at);
