# Backup and Restore

## Backup

```bash
node scripts/backup.js
```

Creates a timestamped SQLite backup in `./backups/`:
```
backups/fme_test_backup_2026-08-19T16-30-00-000Z.db
```

Safe to run while the application is live (uses SQLite online backup API).
Backup files are gitignored.

## Restore

**Stop the application first.**

```bash
node scripts/restore.js backups/fme_test_backup_2026-08-19T16-30-00-000Z.db
```

This:
1. Archives the current database as `<db-path>.pre-restore-<timestamp>.db`
2. Copies the backup to the active `DB_PATH`
3. Exits

Then restart the application:
```bash
npm start
```

## Automated Backup Schedule

For production, schedule backup via cron:
```cron
0 * * * * cd /app && node scripts/backup.js >> logs/backup.log 2>&1
```

## SQLite Backup Properties

- Hot backup: no downtime required
- Point-in-time: snapshot at moment of backup call
- WAL mode: consistent backup during concurrent reads
- Size: proportional to data stored (small for this application)

## Disaster Recovery

1. Provision a new environment
2. Clone the repository
3. `npm install`
4. Configure `.env`
5. Copy backup file to accessible path
6. `node scripts/restore.js <backup-file>`
7. `npm start`
8. Verify: `curl /api/health`
