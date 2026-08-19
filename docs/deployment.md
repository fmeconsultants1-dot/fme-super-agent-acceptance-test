# Deployment

## Available Targets

### Option A: Docker

```bash
# From repository root:
docker build -f deployment/docker/Dockerfile -t fme-acceptance-test .
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e DB_PATH=/app/data/fme_test.db \
  -e WEATHER_PROVIDER=open-meteo \
  -v fme_data:/app/data \
  fme-acceptance-test
```

Or via Compose:
```bash
docker-compose -f deployment/docker/docker-compose.yml up
```

Health check: GET http://localhost:3000/api/health

### Option B: Railway

1. Connect GitHub repository in Railway dashboard.
2. Railway detects Node.js automatically.
3. Set environment variables in Railway dashboard (see `.env.example`).
4. Deploy. `railway.json` configures health check path `/api/health`.

### Option C: Render

1. Connect repository.
2. Use `render.yaml` (auto-detected).
3. Set `OPENWEATHERMAP_API_KEY` in Render dashboard if enabling Provider B.

### Option D: Heroku / Procfile-compatible

```bash
heroku create fme-acceptance-test
heroku config:set NODE_ENV=production WEATHER_PROVIDER=open-meteo
git push heroku main
```

## Post-Deployment Verification

```bash
curl https://YOUR-DOMAIN/api/health
# Expect: { "status": "OK", "database": { "status": "OK" } }

curl https://YOUR-DOMAIN/api/weather/current
# Expect: temperature_c, description, provider: "Open-Meteo (Provider A)"

curl -X POST https://YOUR-DOMAIN/api/test-jobs \
  -H 'Content-Type: application/json' \
  -d '{"title":"Smoke test","status":"OPEN"}'
# Expect: 201 with job object
```

## Portability Proof (Test 12)

```bash
# Clone fresh
git clone https://github.com/fmeconsultants1-dot/fme-super-agent-acceptance-test.git test-env-2
cd test-env-2
npm install
cp .env.example .env
# Edit .env: set DB_PATH, PORT
npm run migrate
npm start
curl http://localhost:3001/api/health
npm test
```

This sequence reconstructs the full application from the repository with no manual steps beyond filling in .env values.
