const express = require('express');
const router = express.Router();
const imageController = require('../controllers/image.controller');
const { imageLimiter } = require('../middleware/rateLimit');
const { asyncHandler } = require('../utils/helpers');

router.get('/search', imageLimiter, asyncHandler(imageController.search));

module.exports = router;
