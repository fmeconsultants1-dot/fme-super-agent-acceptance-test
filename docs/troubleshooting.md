# Troubleshooting

## Application won't start

**Symptom:** `Error: Cannot find module` or `ENOENT`  
**Fix:** Run `npm install`. Ensure Node.js 18+ is installed.

**Symptom:** `SQLITE_ERROR` on start  
**Fix:** Run `npm run migrate` to initialise the database. Check `DB_PATH` in `.env`.

**Symptom:** `Port 3000 already in use`  
**Fix:** Change `PORT` in `.env`, or kill the existing process:
```bash
lsof -ti:3000 | xargs kill
```

## Health check fails

**Symptom:** `GET /api/health` returns `database: { status: 'ERROR' }`  
**Fix:**
1. Check `DB_PATH` in `.env` points to a writable directory.
2. Run `npm run migrate`.
3. Check disk space.

## Weather endpoint returns 503 INTEGRATION_PENDING

**Symptom:** `/api/weather/current` returns `{ "status": "INTEGRATION_PENDING" }`  
**Cause:** `WEATHER_PROVIDER=openweathermap` but `OPENWEATHERMAP_API_KEY` is blank.  
**Fix:** Either:
- Set `WEATHER_PROVIDER=open-meteo` (no key required), or
- Obtain and set `OPENWEATHERMAP_API_KEY` (see `docs/integrations.md` HUMAN GATE)

## Weather endpoint returns 502

**Symptom:** Provider error  
**Cause:** Open-Meteo API temporarily unavailable or network issue.  
**Fix:** The application degrades gracefully. Retry after a moment. Check https://open-meteo.com status.

## Tests fail with database errors

**Symptom:** Jest tests error on DB access  
**Fix:**
1. Ensure `DB_PATH` in `.env` (or environment) is writable.
2. Migrations run automatically via `src/server.js` on import — ensure `require('../src/server')` in tests resolves correctly.
3. Delete the test DB and re-run: `rm -f data/fme_test.db && npm test`

## Broken display route returns null

**Status:** Fixed in commit `4fe045b1`.  
**Root cause was:** `note.body || undefined` coerced empty string to null in JSON.  
**Fix applied:** `note.body ?? ''` (nullish coalescing).  
**Regression test:** `tests/notes.test.js` — TEST-02 block.

## Job replay fails with "not in state C/FAILED"

**Cause:** The job is already completed or was never in a failed state.  
**Fix:** Only jobs with `stage=C, state=FAILED` can be replayed. Check job state via `GET /api/jobs/:jobId`.

## Secret scan reports issues

```bash
node scripts/secret-scan.js
```

If issues found: remove hardcoded values, move to `.env`, and ensure `.env` is gitignored.
