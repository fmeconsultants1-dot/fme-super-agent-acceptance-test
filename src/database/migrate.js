/**
 * FME Acceptance Test — Migration Runner
 * Idempotent: safe to run multiple times.
 * Migrations are ordered and tracked in schema_migrations table.
 */
'use strict';
require('dotenv').config();
const path = require('path');
const fs   = require('fs');
const db   = require('./connection');

const MIGRATIONS = [
  {
    version: '001_initial_schema',
    up: () => {
      const sql = fs.readFileSync(
        path.join(__dirname, 'schema.sql'), 'utf8'
      );
      db.exec(sql);
    }
  },
  {
    version: '002_seed_working_note',
    up: () => {
      const exists = db.prepare(
        "SELECT id FROM notes WHERE title = 'Welcome Note' LIMIT 1"
      ).get();
      if (!exists) {
        db.prepare(
          "INSERT INTO notes (title, body) VALUES (?, ?)"
        ).run('Welcome Note', 'This note was seeded by migration 002. Working feature confirmed.');
      }
    }
  },
  {
    version: '003_seed_broken_note',
    up: () => {
      // Intentionally seeds a note with an empty body to trigger the broken
      // display feature (body renders as undefined instead of '').
      // This note is used in Test 02 to demonstrate the pre-repair failure.
      const exists = db.prepare(
        "SELECT id FROM notes WHERE title = 'Broken Display Note' LIMIT 1"
      ).get();
      if (!exists) {
        db.prepare(
          "INSERT INTO notes (title, body) VALUES (?, ?)"
        ).run('Broken Display Note', '');
      }
    }
  }
];

function runMigrations() {
  // Bootstrap migrations table first
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      version    TEXT    NOT NULL UNIQUE,
      applied_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = new Set(
    db.prepare('SELECT version FROM schema_migrations').all().map(r => r.version)
  );

  let ran = 0;
  for (const migration of MIGRATIONS) {
    if (applied.has(migration.version)) {
      console.log(`  [SKIP] ${migration.version} — already applied`);
      continue;
    }
    console.log(`  [RUN]  ${migration.version}`);
    const runOne = db.transaction(() => {
      migration.up();
      db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(migration.version);
    });
    runOne();
    console.log(`  [OK]   ${migration.version}`);
    ran++;
  }

  console.log(`\nMigrations complete. ${ran} applied, ${applied.size} already present.`);
}

runMigrations();
module.exports = { runMigrations };
