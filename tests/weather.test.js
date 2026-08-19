/**
 * TEST: Weather provider — Tests 4, 6, 7
 * Verifies interface, adapter abstraction, provider describe(),
 * and graceful INTEGRATION_PENDING handling for Provider B.
 */
'use strict';
const WeatherProviderInterface = require('../src/adapters/WeatherProviderInterface');
const ProviderA                = require('../src/adapters/ProviderA_OpenMeteo');
const ProviderB                = require('../src/adapters/ProviderB_OpenWeatherMap');
const { getWeatherProvider, REGISTRY } = require('../src/adapters/weatherProviderFactory');
const request                  = require('supertest');
const app                      = require('../src/server');

describe('WeatherProviderInterface — contract enforcement', () => {
  it('throws if getCurrentWeather not implemented', async () => {
    const bare = new WeatherProviderInterface();
    await expect(bare.getCurrentWeather(0, 0)).rejects.toThrow('must implement getCurrentWeather');
  });

  it('throws if describe not implemented', () => {
    const bare = new WeatherProviderInterface();
    expect(() => bare.describe()).toThrow('must implement describe');
  });
});

describe('ProviderA (Open-Meteo) — adapter', () => {
  it('is an instance of WeatherProviderInterface', () => {
    expect(new ProviderA()).toBeInstanceOf(WeatherProviderInterface);
  });

  it('describe() returns correct metadata', () => {
    const d = new ProviderA().describe();
    expect(d.name).toMatch(/Open-Meteo/);
    expect(d.authenticated).toBe(false);
  });
});

describe('ProviderB (OpenWeatherMap) — INTEGRATION_PENDING adapter', () => {
  let originalKey;
  beforeAll(() => { originalKey = process.env.OPENWEATHERMAP_API_KEY; delete process.env.OPENWEATHERMAP_API_KEY; });
  afterAll(() => { if (originalKey) process.env.OPENWEATHERMAP_API_KEY = originalKey; });

  it('is an instance of WeatherProviderInterface', () => {
    expect(new ProviderB()).toBeInstanceOf(WeatherProviderInterface);
  });

  it('describe() reports not authenticated when key missing', () => {
    const d = new ProviderB().describe();
    expect(d.authenticated).toBe(false);
    expect(d.note).toMatch(/INTEGRATION_PENDING/);
  });

  it('throws INTEGRATION_PENDING error when key missing', async () => {
    const p = new ProviderB();
    await expect(p.getCurrentWeather(49.28, -123.12)).rejects.toMatchObject({
      code: 'INTEGRATION_PENDING'
    });
  });
});

describe('weatherProviderFactory — provider abstraction', () => {
  it('returns ProviderA by default (WEATHER_PROVIDER=open-meteo)', () => {
    process.env.WEATHER_PROVIDER = 'open-meteo';
    expect(getWeatherProvider()).toBeInstanceOf(ProviderA);
  });

  it('returns ProviderB when WEATHER_PROVIDER=openweathermap', () => {
    process.env.WEATHER_PROVIDER = 'openweathermap';
    expect(getWeatherProvider()).toBeInstanceOf(ProviderB);
    process.env.WEATHER_PROVIDER = 'open-meteo';
  });

  it('falls back to ProviderA for unknown provider name', () => {
    process.env.WEATHER_PROVIDER = 'does-not-exist';
    expect(getWeatherProvider()).toBeInstanceOf(ProviderA);
    process.env.WEATHER_PROVIDER = 'open-meteo';
  });

  it('REGISTRY contains both provider keys', () => {
    expect(REGISTRY).toHaveProperty('open-meteo');
    expect(REGISTRY).toHaveProperty('openweathermap');
  });
});

describe('GET /api/weather/provider — HTTP route', () => {
  it('returns active provider description', async () => {
    process.env.WEATHER_PROVIDER = 'open-meteo';
    const res = await request(app).get('/api/weather/provider');
    expect(res.status).toBe(200);
    expect(res.body.provider.name).toMatch(/Open-Meteo/);
  });
});

describe('GET /api/weather/current — rejects bad coordinates', () => {
  it('returns 400 for non-numeric lat', async () => {
    const res = await request(app).get('/api/weather/current?lat=abc&lon=0');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/weather/current — INTEGRATION_PENDING response for Provider B', () => {
  let originalKey, originalProvider;
  beforeAll(() => {
    originalKey      = process.env.OPENWEATHERMAP_API_KEY;
    originalProvider = process.env.WEATHER_PROVIDER;
    delete process.env.OPENWEATHERMAP_API_KEY;
    process.env.WEATHER_PROVIDER = 'openweathermap';
  });
  afterAll(() => {
    if (originalKey) process.env.OPENWEATHERMAP_API_KEY = originalKey;
    process.env.WEATHER_PROVIDER = originalProvider || 'open-meteo';
  });

  it('returns 503 with INTEGRATION_PENDING status', async () => {
    const res = await request(app).get('/api/weather/current');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('INTEGRATION_PENDING');
  });
});
