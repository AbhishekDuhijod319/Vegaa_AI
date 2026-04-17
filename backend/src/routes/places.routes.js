const express = require('express');
const router = express.Router();
const placesController = require('../controllers/places.controller');
const { apiLimiter, placePhotoLimiter } = require('../middleware/rateLimit');
const { asyncHandler } = require('../utils/helpers');

router.get('/suggestions', apiLimiter, asyncHandler(placesController.suggestions));
router.get('/details', apiLimiter, asyncHandler(placesController.details));
router.get('/search', apiLimiter, asyncHandler(placesController.search));
router.get('/photo', placePhotoLimiter, asyncHandler(placesController.photo));

module.exports = router;
