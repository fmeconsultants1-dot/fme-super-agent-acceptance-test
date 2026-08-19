/**
 * WeatherProviderInterface
 * ========================
 * Defines the contract all weather provider adapters must implement.
 * Business logic (routes, UI) depends ONLY on this interface.
 * Swap providers by changing WEATHER_PROVIDER env var — zero business logic changes.
 *
 * Contract:
 *   getCurrentWeather(lat, lon) → Promise<WeatherResult>
 *
 * WeatherResult shape:
 * {
 *   provider:      string,   // which adapter answered
 *   location:      string,   // human-readable location
 *   temperature_c: number,   // current temp in Celsius
 *   temperature_f: number,   // current temp in Fahrenheit
 *   description:   string,   // human-readable condition
 *   wind_speed_kmh:number,   // wind speed
 *   humidity_pct:  number|null,
 *   fetched_at:    string,   // ISO timestamp
 *   raw:           object    // raw provider response (for debugging)
 * }
 */
'use strict';

class WeatherProviderInterface {
  /**
   * @param {number} lat
   * @param {number} lon
   * @returns {Promise<WeatherResult>}
   */
  // eslint-disable-next-line no-unused-vars
  async getCurrentWeather(lat, lon) {
    throw new Error(`${this.constructor.name} must implement getCurrentWeather(lat, lon)`);
  }

  /**
   * Returns provider metadata for health/status endpoints.
   * @returns {{ name: string, authenticated: boolean, note: string }}
   */
  describe() {
    throw new Error(`${this.constructor.name} must implement describe()`);
  }
}

module.exports = WeatherProviderInterface;
