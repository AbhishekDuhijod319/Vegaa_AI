const weatherService = require('../services/weather.service');

const weatherController = {
  async getWeather(req, res) {
    const city = req.query.city;
    if (!city) return res.status(400).json({ error: 'Query parameter "city" is required.' });
    const weather = await weatherService.getWeather(city);
    res.json({ weather });
  },
};

module.exports = weatherController;
