const express = require('express');
const router = express.Router();
const tripController = require('../controllers/trip.controller');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimit');
const { validate, createTripSchema, updateTripSchema } = require('../middleware/validate');
const { asyncHandler } = require('../utils/helpers');

// All trip routes are rate limited
router.use(apiLimiter);

// Protected routes (require auth)
router.post('/', authenticate, validate(createTripSchema), asyncHandler(tripController.create));
router.get('/', authenticate, asyncHandler(tripController.list));
router.put('/:id', authenticate, validate(updateTripSchema), asyncHandler(tripController.update));
router.delete('/:id', authenticate, asyncHandler(tripController.delete));
router.get('/stats', authenticate, asyncHandler(tripController.stats));

// Public route (for shareable trip links)
router.get('/:id', optionalAuth, asyncHandler(tripController.getById));

module.exports = router;
