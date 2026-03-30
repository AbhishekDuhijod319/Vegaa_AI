const express = require('express');
const router = express.Router();
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimit');
const { validate, generateTripSchema } = require('../middleware/validate');
const { asyncHandler } = require('../utils/helpers');

router.post('/generate-trip', authenticate, aiLimiter, validate(generateTripSchema), asyncHandler(aiController.generateTrip));

module.exports = router;
