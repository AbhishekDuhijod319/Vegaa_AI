const Joi = require('joi');

/**
 * Creates an Express middleware that validates req.body against a Joi schema.
 * Returns 400 with detailed error messages on validation failure.
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((d) => d.message);
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    req.body = value; // Use sanitized values
    next();
  };
};

// ─── Auth Schemas ───────────────────────────────────

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().min(8).max(128).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required(),
  password: Joi.string().required(),
});

const googleAuthSchema = Joi.object({
  accessToken: Joi.string().required(),
});

// ─── Trip Schemas ───────────────────────────────────

const createTripSchema = Joi.object({
  userSelection: Joi.object({
    destination: Joi.alternatives().try(Joi.object(), Joi.string()).required(),
    startLocation: Joi.alternatives().try(Joi.object(), Joi.string()).allow(null),
    startDate: Joi.string().required(),
    endDate: Joi.string().required(),
    currency: Joi.string().default('INR'),
    amount: Joi.number().positive().required(),
    numTravelers: Joi.number().integer().min(1).max(15).default(1),
    transportMode: Joi.string().allow('', null),
    noOfDays: Joi.number().integer().min(1).max(20),
  }).required(),
  tripData: Joi.object().required(),
  coverPhotoUrl: Joi.string().uri().allow('').default(''),
  summary: Joi.string().allow('').default(''),
});

const updateTripSchema = Joi.object({
  userSelection: Joi.object({
    destination: Joi.alternatives().try(Joi.object(), Joi.string()),
    startLocation: Joi.alternatives().try(Joi.object(), Joi.string()).allow(null),
    startDate: Joi.string(),
    endDate: Joi.string(),
    currency: Joi.string(),
    amount: Joi.number().positive(),
    numTravelers: Joi.number().integer().min(1).max(15),
    transportMode: Joi.string().allow('', null),
    noOfDays: Joi.number().integer().min(1).max(20),
  }),
  tripData: Joi.object(),
  coverPhotoUrl: Joi.string().uri().allow(''),
  summary: Joi.string().allow(''),
  status: Joi.string().valid('draft', 'generated', 'archived'),
});

// ─── AI Schemas ─────────────────────────────────────

const generateTripSchema = Joi.object({
  destination: Joi.string().required(),
  startLocation: Joi.string().allow('', null),
  totalDays: Joi.number().integer().min(1).max(20).required(),
  travelers: Joi.number().integer().min(1).max(15).required(),
  budget: Joi.number().positive().required(),
  currency: Joi.string().default('INR'),
  transportMode: Joi.string().allow('', null),
  startDate: Joi.string().allow('', null),
  endDate: Joi.string().allow('', null),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  googleAuthSchema,
  createTripSchema,
  updateTripSchema,
  generateTripSchema,
};
