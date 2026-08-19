/**
 * ProviderA — Open-Meteo
 * ======================
 * Free, no API key required. WMO weather codes decoded to human labels.
 * Official docs: https://open-meteo.com/en/docs
 * Verified against API: 2026-08-19
 *
 * Implements WeatherProviderInterface.
 */
'use strict';
const fetch                   = require('node-fetch');
const WeatherProviderInterface = require('./WeatherProviderInterface');

// WMO Weather Interpretation Codes (per open-meteo docs)
const WMO_CODES = {
  0:  'Clear sky',
  1:  'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Foggy', 48: 'Depositing rime fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
  80: 'Slight showers', 81: 'Moderate showers', 82: 'Violent showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Heavy thunderstorm with hail'
};

class ProviderA_OpenMeteo extends WeatherProviderInterface {
  constructor() {
    super();
    this.baseUrl = 'https://api.open-meteo.com/v1/forecast';
  }

  describe() {
    return {
      name:          'Open-Meteo (Provider A)',
      authenticated: false,
      note:          'Free tier. No API key required. Docs: https://open-meteo.com/en/docs'
    };
  }

  async getCurrentWeather(lat, lon) {
    const params = new URLSearchParams({
      latitude:       lat,
      longitude:      lon,
      current:        [
        'temperature_2m',
        'relative_humidity_2m',
        'wind_speed_10m',
        'weathercode'
      ].join(','),
      temperature_unit: 'celsius',
      wind_speed_unit:  'kmh',
      timezone:         'auto'
    });

    const url = `${this.baseUrl}?${params}`;
    const res = await fetch(url, { timeout: 8000 });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Open-Meteo HTTP ${res.status}: ${text}`);
    }

    const data = await res.json();
    const cur  = data.current;

    if (!cur) {
      throw new Error('Open-Meteo: missing current block in response');
    }

    const temp_c = cur.temperature_2m;
    return {
      provider:       'Open-Meteo (Provider A)',
      location:       `${lat},${lon}`,
      temperature_c:  temp_c,
      temperature_f:  parseFloat(((temp_c * 9) / 5 + 32).toFixed(1)),
      description:    WMO_CODES[cur.weathercode] || `WMO code ${cur.weathercode}`,
      wind_speed_kmh: cur.wind_speed_10m,
      humidity_pct:   cur.relative_humidity_2m ?? null,
      fetched_at:     new Date().toISOString(),
      raw:            data
    };
  }
}

module.exports = ProviderA_OpenMeteo;
