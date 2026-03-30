const rateLimit = require('express-rate-limit');

const createLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: message },
    keyGenerator: (req) => req.user?.userId || req.ip,
  });

// Auth endpoints: strict — 10 requests per 15 minutes
const authLimiter = createLimiter(
  15 * 60 * 1000,
  10,
  'Too many auth attempts. Please try again in 15 minutes.'
);

// AI generation: 10 per hour (expensive operation)
const aiLimiter = createLimiter(
  60 * 60 * 1000,
  10,
  'AI generation limit reached. Please try again later.'
);

// General API: 100 per hour
const apiLimiter = createLimiter(
  60 * 60 * 1000,
  100,
  'Rate limit exceeded. Please slow down.'
);

module.exports = { authLimiter, aiLimiter, apiLimiter };
