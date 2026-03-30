const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weather.controller');
const { apiLimiter } = require('../middleware/rateLimit');
const { asyncHandler } = require('../utils/helpers');

router.get('/', apiLimiter, asyncHandler(weatherController.getWeather));

module.exports = router;
