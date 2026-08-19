# Integrations

## Integration Status

| Integration | Provider | Status | Auth Method |
|---|---|---|---|
| Weather — Provider A | Open-Meteo | ✅ VERIFIED | None (free public API) |
| Weather — Provider B | OpenWeatherMap | 🔵 INTEGRATION_PENDING | API Key |

---

## Provider A — Open-Meteo (VERIFIED)

**Status:** VERIFIED
**Authentication:** None required
**Docs:** https://open-meteo.com/en/docs
**Endpoint:** `https://api.open-meteo.com/v1/forecast`
**Verified:** 2026-08-19 — live call returned 23°C, Vancouver, WMO code 0 (Clear sky)

### Configuration

```env
WEATHER_PROVIDER=open-meteo
WEATHER_LAT=49.2827
WEATHER_LON=-123.1207
WEATHER_LOCATION_NAME=Vancouver
```

### Provider Swap

To switch to Provider B, change only:
```env
WEATHER_PROVIDER=openweathermap
OPENWEATHERMAP_API_KEY=your-key-here
```
No code changes required. The factory pattern handles the rest.

---

## Provider B — OpenWeatherMap — HUMAN GATE

**Status:** INTEGRATION_PENDING

### Work Already Completed

- Adapter class `ProviderB_OpenWeatherMap.js` fully implemented
- Implements `WeatherProviderInterface` contract
- Reads `OPENWEATHERMAP_API_KEY` from environment
- Returns `INTEGRATION_PENDING` error with code when key absent
- Route returns HTTP 503 with clear status when provider unavailable
- `.env.example` contains `OPENWEATHERMAP_API_KEY=` slot
- Factory supports `WEATHER_PROVIDER=openweathermap`
- Tests verify graceful degradation when key missing
- Documentation complete

### HUMAN GATE

**Provider:** OpenWeatherMap  
**Purpose:** Alternate weather data source (Test 5 — authenticated provider)  
**Credential required:** API key (`OPENWEATHERMAP_API_KEY`)  
**Auth method:** API key passed as `appid` query parameter  
**Docs:** https://openweathermap.org/api  

**Exact owner action:**
1. Visit https://openweathermap.org/
2. Create a free account (or sign in)
3. Navigate to: Account → My API Keys
4. Generate or copy an API key
5. Set `OPENWEATHERMAP_API_KEY=<your-key>` in your deployment environment
6. Set `WEATHER_PROVIDER=openweathermap` in your deployment environment
7. Restart the application

**Secret slot already created:** `OPENWEATHERMAP_API_KEY` in `.env.example` and all deployment configs  
**Automatic resume point:** Provider B will activate automatically on next application start once the key is set. No code changes required.

---

## Adding a New Provider

1. Create `src/adapters/ProviderC_YourProvider.js` implementing `WeatherProviderInterface`
2. Add `'your-provider-name': () => new ProviderC()` to `weatherProviderFactory.js` REGISTRY
3. Set `WEATHER_PROVIDER=your-provider-name` in `.env`
4. Add tests in `tests/weather.test.js`
5. Update this file
