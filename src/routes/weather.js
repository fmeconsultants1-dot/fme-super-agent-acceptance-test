/**
 * /api/weather — External data feature (Tests 4, 6, 7)
 * Consumes WeatherProviderInterface — never imports a concrete provider.
 * Provider swap = env var change only.
 */
'use strict';
const express = require('express');
const { getWeatherProvider } = require('../adapters/weatherProviderFactory');
const router  = express.Router();

// GET /api/weather/current
router.get('/current', async (req, res) => {
  const lat      = parseFloat(req.query.lat  || process.env.WEATHER_LAT  || '49.2827');
  const lon      = parseFloat(req.query.lon  || process.env.WEATHER_LON  || '-123.1207');
  const location = req.query.location || process.env.WEATHER_LOCATION_NAME || 'Vancouver';

  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: 'lat and lon must be valid numbers' });
  }

  const provider = getWeatherProvider();

  try {
    const result = await provider.getCurrentWeather(lat, lon);
    res.json({ location, ...result });
  } catch (err) {
    if (err.code === 'INTEGRATION_PENDING') {
      return res.status(503).json({
        status:  'INTEGRATION_PENDING',
        message: err.message,
        provider: provider.describe()
      });
    }
    console.error('[WeatherRoute] Error:', err.message);
    res.status(502).json({
      error:    'Weather provider error',
      detail:   err.message,
      provider: provider.describe().name
    });
  }
});

// GET /api/weather/provider — describe active provider (no call made)
router.get('/provider', (req, res) => {
  const provider = getWeatherProvider();
  res.json({ provider: provider.describe() });
});

module.exports = router;
