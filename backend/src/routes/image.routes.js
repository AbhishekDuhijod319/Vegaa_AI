const express = require('express');
const router = express.Router();
const imageController = require('../controllers/image.controller');
const { apiLimiter } = require('../middleware/rateLimit');
const { asyncHandler } = require('../utils/helpers');

router.get('/search', apiLimiter, asyncHandler(imageController.search));

module.exports = router;
