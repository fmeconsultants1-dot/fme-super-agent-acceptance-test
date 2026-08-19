# FME Super Agent — Acceptance Test Application

> **Isolated test environment. Do NOT use for production.**
> Created: 2026-08-19 | Purpose: FME Software & Integration Super Agent Acceptance Test

## What This Is

A small but complete Node.js/Express web application built to prove the FME Super Agent can own a software outcome end-to-end: inspect, repair, build, integrate, test, deploy, and document.

## Features

| Feature | Status | Description |
|---|---|---|
| Notes CRUD | ✅ Working | Create, read, update, delete notes |
| Notes Display Route | ✅ Repaired | Was broken (Test 02 — `\|\|` → `??` fix) |
| Software Test Jobs | ✅ Built | Full CRUD with 4-state status machine |
| Weather — Open-Meteo | ✅ VERIFIED | Live external API, no key required |
| Weather — OpenWeatherMap | 🔵 INTEGRATION_PENDING | Adapter built, key not yet configured |
| Job Runner (Failure/Replay) | ✅ Built | 3-stage pipeline with stage-level replay |
| Health endpoint | ✅ Working | `/api/health` with DB connectivity check |

## Quick Start

```bash
git clone https://github.com/fmeconsultants1-dot/fme-super-agent-acceptance-test.git
cd fme-super-agent-acceptance-test
npm install
cp .env.example .env
# Edit .env as needed (defaults work for local dev)
npm run migrate
npm start
# Open http://localhost:3000
```

## Test

```bash
npm test
```

## Repository Structure

```
├── src/
│   ├── server.js              # Express entry point
│   ├── routes/                # HTTP route handlers
│   ├── services/              # Business logic (job runner)
│   ├── adapters/              # Provider interface + concrete adapters
│   └── database/              # Connection, schema, migrations
├── public/                    # Frontend (HTML/CSS/JS)
├── tests/                     # Jest test suite
├── scripts/                   # Maintenance scripts
├── deployment/                # Docker, Railway, Render configs
├── docs/                      # Architecture, setup, ops docs
├── data/                      # SQLite database (gitignored)
├── backups/                   # Backup files (gitignored)
├── .env.example               # Environment template (no secrets)
└── package.json
```

## Environment Variables

See `.env.example` for full list. All secrets stored in environment only — never committed.

## Documentation

- [Architecture](docs/architecture.md)
- [Setup](docs/setup.md)
- [Deployment](docs/deployment.md)
- [Integrations](docs/integrations.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Backup & Restore](docs/backup-restore.md)
