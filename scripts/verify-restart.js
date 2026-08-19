/**
 * FME Restart Verification Script — Test 10
 * ===========================================
 * Verifies that database records survive application restart.
 * Must be run AFTER the app has been started at least once (to create initial data).
 *
 * Steps performed:
 *   1. Connect to DB directly (simulating a fresh start).
 *   2. Count existing records.
 *   3. Verify seeded migration records exist.
 *   4. Verify no duplication occurred.
 *   5. Report pass/fail.
 *
 * Run: node scripts/verify-restart.js
 */
'use strict';
require('dotenv').config();
const db = require('../src/database/connection');

console.log('\n=== FME RESTART / STATE SURVIVAL VERIFICATION (Test 10) ===\n');

// 1. Count records
const noteCount    = db.prepare('SELECT COUNT(*) as c FROM notes').get().c;
const jobCount     = db.prepare('SELECT COUNT(*) as c FROM test_jobs').get().c;
const jobRunCount  = db.prepare('SELECT COUNT(*) as c FROM job_runs').get().c;
const migrations   = db.prepare('SELECT version FROM schema_migrations ORDER BY id').all();

console.log(`Notes:      ${noteCount}`);
console.log(`Test Jobs:  ${jobCount}`);
console.log(`Job Runs:   ${jobRunCount}`);
console.log(`Migrations: ${migrations.map(m => m.version).join(', ')}`);

// 2. Verify seeded records from migration 002 exist
const welcomeNote = db.prepare("SELECT * FROM notes WHERE title = 'Welcome Note'").get();
if (!welcomeNote) {
  console.error('[FAIL] Seeded Welcome Note not found — data did not survive restart');
  process.exit(1);
}
console.log(`\n[PASS] Seeded note survived: "${welcomeNote.title}" (id=${welcomeNote.id})`);

// 3. Verify migrations not duplicated
const migVersions = migrations.map(m => m.version);
const uniqueMigrations = new Set(migVersions);
if (migVersions.length !== uniqueMigrations.size) {
  console.error('[FAIL] Duplicate migration entries detected — idempotency broken');
  process.exit(1);
}
console.log('[PASS] Migration records are unique — no duplicate execution');

// 4. DB connection healthy
const ping = db.prepare('SELECT 1 as ok').get();
if (ping.ok !== 1) {
  console.error('[FAIL] Database connectivity check failed');
  process.exit(1);
}
console.log('[PASS] Database connectivity: OK');
console.log('[PASS] Application state survived simulated restart');
console.log('\n=== TEST 10: PASS ===\n');
process.exit(0);
