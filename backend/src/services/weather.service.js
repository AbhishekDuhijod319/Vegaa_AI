const axios = require('axios');
const config = require('../config/env');
const { weatherCache, getOrFetch } = require('../utils/cache');
const logger = require('../utils/logger');

const weatherService = {
  async getWeather(city) {
    if (!config.apis.openWeather) {
      logger.warn('OpenWeather API key not configured.');
      return null;
    }

    const cacheKey = `weather:${city.toLowerCase().trim()}`;

    return getOrFetch(weatherCache, cacheKey, async () => {
      const resp = await axios.get(
        'https://api.openweathermap.org/data/2.5/weather',
        {
          params: {
            q: city,
            appid: config.apis.openWeather,
            units: 'metric',
          },
        }
      );

      const d = resp.data;
      return {
        city: d.name,
        country: d.sys?.country,
        temp: d.main?.temp,
        feelsLike: d.main?.feels_like,
        humidity: d.main?.humidity,
        description: d.weather?.[0]?.description,
        icon: d.weather?.[0]?.icon,
        wind: d.wind?.speed,
      };
    });
  },
};

module.exports = weatherService;
