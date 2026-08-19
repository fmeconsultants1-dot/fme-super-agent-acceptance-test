/**
 * FME Backup Script
 * =================
 * Creates a timestamped SQLite backup in ./backups/
 * Safe to run while the application is live (SQLite backup API).
 * Run: node scripts/backup.js
 */
'use strict';
require('dotenv').config();
const path = require('path');
const fs   = require('fs');
const db   = require('../src/database/connection');

const backupDir = path.resolve(__dirname, '../backups');
fs.mkdirSync(backupDir, { recursive: true });

const ts         = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupDir, `fme_test_backup_${ts}.db`);

console.log(`[BACKUP] Creating backup → ${backupPath}`);

// better-sqlite3 online backup API — safe during live operation
db.backup(backupPath)
  .then(() => {
    const size = fs.statSync(backupPath).size;
    console.log(`[BACKUP] Complete. Size: ${size} bytes`);
    process.exit(0);
  })
  .catch(err => {
    console.error('[BACKUP] Failed:', err.message);
    process.exit(1);
  });
