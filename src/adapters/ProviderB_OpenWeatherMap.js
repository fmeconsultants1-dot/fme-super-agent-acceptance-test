/**
 * ProviderB — OpenWeatherMap
 * ==========================
 * Requires API key: OPENWEATHERMAP_API_KEY
 * Official docs: https://openweathermap.org/current
 * Status: INTEGRATION_PENDING — API key not yet configured.
 *
 * Implements WeatherProviderInterface.
 * When key is present, swap WEATHER_PROVIDER=openweathermap in .env.
 */
'use strict';
const fetch                   = require('node-fetch');
const WeatherProviderInterface = require('./WeatherProviderInterface');

class ProviderB_OpenWeatherMap extends WeatherProviderInterface {
  constructor() {
    super();
    this.baseUrl = 'https://api.openweathermap.org/data/2.5/weather';
    this.apiKey  = process.env.OPENWEATHERMAP_API_KEY || '';
  }

  describe() {
    return {
      name:          'OpenWeatherMap (Provider B)',
      authenticated: Boolean(this.apiKey),
      note:          this.apiKey
        ? 'API key configured.'
        : 'INTEGRATION_PENDING — set OPENWEATHERMAP_API_KEY in .env. See docs/integrations.md.'
    };
  }

  async getCurrentWeather(lat, lon) {
    if (!this.apiKey) {
      const err = new Error(
        'INTEGRATION_PENDING: OPENWEATHERMAP_API_KEY not set. ' +
        'See HUMAN GATE in docs/integrations.md.'
      );
      err.code = 'INTEGRATION_PENDING';
      throw err;
    }

    const params = new URLSearchParams({
      lat,
      lon,
      appid: this.apiKey,
      units: 'metric'
    });

    const res = await fetch(`${this.baseUrl}?${params}`, { timeout: 8000 });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`OpenWeatherMap HTTP ${res.status}: ${text}`);
    }

    const data = await res.json();
    const temp_c = data.main.temp;
    return {
      provider:       'OpenWeatherMap (Provider B)',
      location:       data.name || `${lat},${lon}`,
      temperature_c:  temp_c,
      temperature_f:  parseFloat(((temp_c * 9) / 5 + 32).toFixed(1)),
      description:    data.weather?.[0]?.description || 'unknown',
      wind_speed_kmh: parseFloat((data.wind?.speed * 3.6).toFixed(1)),
      humidity_pct:   data.main?.humidity ?? null,
      fetched_at:     new Date().toISOString(),
      raw:            data
    };
  }
}

module.exports = ProviderB_OpenWeatherMap;
