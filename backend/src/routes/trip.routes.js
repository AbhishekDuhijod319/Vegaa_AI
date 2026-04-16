const express = require('express');
const router = express.Router();
const tripController = require('../controllers/trip.controller');
const { authenticate } = require('../middleware/auth');
const { apiLimiter, aiLimiter } = require('../middleware/rateLimit');
const { validate, createTripSchema, updateTripSchema } = require('../middleware/validate');
const { asyncHandler } = require('../utils/helpers');

// All trip routes are rate limited
router.use(apiLimiter);

// Protected routes (require auth)
router.post('/', authenticate, validate(createTripSchema), asyncHandler(tripController.create));
router.get('/', authenticate, asyncHandler(tripController.list));
router.put('/:id', authenticate, aiLimiter, validate(updateTripSchema), asyncHandler(tripController.update));
router.delete('/:id', authenticate, asyncHandler(tripController.delete));
router.get('/stats', authenticate, asyncHandler(tripController.stats));

// Generate a share token for a trip (owner only)
router.post('/:id/share', authenticate, asyncHandler(tripController.generateShareToken));

// View trip (requires login + ownership OR valid share token)
router.get('/:id', authenticate, asyncHandler(tripController.getById));

module.exports = router;
