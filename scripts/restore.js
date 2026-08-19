/**
 * FME Restore Script
 * ==================
 * Restores a SQLite backup to the configured DB_PATH.
 * Usage: node scripts/restore.js <backup-file-path>
 * CAUTION: This overwrites the current database. Stop the app first.
 */
'use strict';
require('dotenv').config();
const path = require('path');
const fs   = require('fs');

const backupFile = process.argv[2];
if (!backupFile) {
  console.error('Usage: node scripts/restore.js <path-to-backup.db>');
  process.exit(1);
}
if (!fs.existsSync(backupFile)) {
  console.error(`Backup file not found: ${backupFile}`);
  process.exit(1);
}

const dbPath = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.resolve(__dirname, '../data/fme_test.db');

// Safety: archive existing before replacing
if (fs.existsSync(dbPath)) {
  const ts      = new Date().toISOString().replace(/[:.]/g, '-');
  const archive = dbPath + `.pre-restore-${ts}.db`;
  fs.copyFileSync(dbPath, archive);
  console.log(`[RESTORE] Archived current DB → ${archive}`);
}

fs.copyFileSync(backupFile, dbPath);
console.log(`[RESTORE] Restored ${backupFile} → ${dbPath}`);
console.log('[RESTORE] Start the application to resume.');
process.exit(0);
