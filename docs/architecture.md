# Architecture

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20 |
| Framework | Express 4 |
| Database | SQLite via better-sqlite3 |
| Frontend | Vanilla HTML/CSS/JS (no build step) |
| Tests | Jest + Supertest |
| Deployment | Docker / Railway / Render / Heroku |

## Application Layers

```
Browser (public/)
    ↓ HTTP
Express Server (src/server.js)
    ↓ routes
src/routes/
    health.js       GET /api/health
    notes.js        CRUD  /api/notes
    testJobs.js     CRUD  /api/test-jobs
    weather.js      GET   /api/weather/current | /api/weather/provider
    jobRunner.js    POST  /api/jobs | GET /api/jobs | POST /api/jobs/:id/replay
    ↓ services / adapters
src/services/
    jobRunner.js    3-stage pipeline with per-stage persistence
src/adapters/
    WeatherProviderInterface.js   Contract (abstract)
    ProviderA_OpenMeteo.js        Concrete — no key, VERIFIED
    ProviderB_OpenWeatherMap.js   Concrete — key required, INTEGRATION_PENDING
    weatherProviderFactory.js     Returns correct adapter from WEATHER_PROVIDER env var
src/database/
    connection.js   Single SQLite connection, WAL mode
    schema.sql      Canonical DDL
    migrate.js      Idempotent migration runner
```

## Provider Abstraction

Business logic never imports a concrete provider. It imports only `weatherProviderFactory`.
Swapping providers requires only a single env var change (`WEATHER_PROVIDER`).
All concrete adapters implement `WeatherProviderInterface`:
- `getCurrentWeather(lat, lon) → Promise<WeatherResult>`
- `describe() → { name, authenticated, note }`

## Job Runner Pipeline

```
Stage A: Validate input        (writes RUNNING → COMPLETE/FAILED to job_runs)
Stage B: Transform data        (same)
Stage C: Persist result        (same)
```

Each stage writes its state to `job_runs` before and after execution.
Replay starts from the failed stage only. Stages A and B are not re-run.

## Database Tables

| Table | Purpose |
|---|---|
| `schema_migrations` | Migration version tracking |
| `notes` | Working feature: notes CRUD |
| `test_jobs` | Test 3 feature: software test jobs |
| `job_runs` | Test 8 feature: job runner stage state |

## Security Model

- Secrets in environment variables only. Never in source.
- `.env` excluded from Git via `.gitignore`.
- `.env.example` contains variable names only (no values).
- Input validated at route layer before DB write.
- SQLite foreign keys enabled.
- No sensitive data returned from health endpoint or display routes.
