-- FME Acceptance Test — Canonical Schema
-- All migrations must be additive. Never drop columns without a backup step.

CREATE TABLE IF NOT EXISTS schema_migrations (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  version    TEXT    NOT NULL UNIQUE,
  applied_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Working feature: simple notes
CREATE TABLE IF NOT EXISTS notes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT    NOT NULL,
  body       TEXT    NOT NULL DEFAULT '',
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Test 3 feature: software test jobs
CREATE TABLE IF NOT EXISTS test_jobs (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT    NOT NULL CHECK(length(trim(title)) > 0),
  status     TEXT    NOT NULL DEFAULT 'OPEN'
             CHECK(status IN ('OPEN','RUNNING','COMPLETE','FAILED')),
  notes      TEXT    NOT NULL DEFAULT '',
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Test 8 feature: background job state tracker
CREATE TABLE IF NOT EXISTS job_runs (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  job_id       TEXT    NOT NULL UNIQUE,
  stage        TEXT    NOT NULL DEFAULT 'A',
  state        TEXT    NOT NULL DEFAULT 'PENDING'
               CHECK(state IN ('PENDING','RUNNING','COMPLETE','FAILED')),
  attempt      INTEGER NOT NULL DEFAULT 0,
  input        TEXT    NOT NULL DEFAULT '{}',
  output       TEXT    NOT NULL DEFAULT '{}',
  error        TEXT    NOT NULL DEFAULT '',
  provider     TEXT    NOT NULL DEFAULT 'internal',
  version      TEXT    NOT NULL DEFAULT '1.0',
  started_at   TEXT,
  completed_at TEXT
);
