/**
 * weatherProviderFactory
 * ======================
 * Returns the correct WeatherProvider adapter based on WEATHER_PROVIDER env var.
 * Business logic never imports a concrete provider directly — only this factory.
 * Replacing a provider = change env var. Zero business logic changes.
 *
 * Supported values:
 *   WEATHER_PROVIDER=open-meteo          → ProviderA (no key needed)
 *   WEATHER_PROVIDER=openweathermap      → ProviderB (key required — INTEGRATION_PENDING)
 */
'use strict';

const ProviderA = require('./ProviderA_OpenMeteo');
const ProviderB = require('./ProviderB_OpenWeatherMap');

const REGISTRY = {
  'open-meteo':     () => new ProviderA(),
  'openweathermap': () => new ProviderB()
};

function getWeatherProvider() {
  const key = (process.env.WEATHER_PROVIDER || 'open-meteo').toLowerCase();
  const factory = REGISTRY[key];
  if (!factory) {
    console.warn(`[WeatherFactory] Unknown provider "${key}". Falling back to open-meteo.`);
    return new ProviderA();
  }
  return factory();
}

module.exports = { getWeatherProvider, REGISTRY };
