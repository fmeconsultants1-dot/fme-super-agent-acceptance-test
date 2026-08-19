# Local Setup

## Prerequisites

- Node.js 18+ (tested on 20)
- npm 9+
- Git

## Steps

### 1. Clone

```bash
git clone https://github.com/fmeconsultants1-dot/fme-super-agent-acceptance-test.git
cd fme-super-agent-acceptance-test
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
NODE_ENV=development
PORT=3000
DB_PATH=./data/fme_test.db
WEATHER_PROVIDER=open-meteo
WEATHER_LAT=49.2827
WEATHER_LON=-123.1207
WEATHER_LOCATION_NAME=Vancouver
# Leave OPENWEATHERMAP_API_KEY blank unless you have a key
```

### 4. Create database and run migrations

```bash
npm run migrate
```

Expected output:
```
[RUN]  001_initial_schema
[OK]   001_initial_schema
[RUN]  002_seed_working_note
[OK]   002_seed_working_note
[RUN]  003_seed_broken_note
[OK]   003_seed_broken_note
Migrations complete. 3 applied, 0 already present.
```

### 5. Start the application

```bash
npm start
```

Open: http://localhost:3000

### 6. Run tests

```bash
npm test
```

### 7. Secret scan (optional)

```bash
node scripts/secret-scan.js
```

### 8. Restart verification (Test 10)

```bash
node scripts/verify-restart.js
```

## Development

```bash
npm run dev   # nodemon watch mode
```
