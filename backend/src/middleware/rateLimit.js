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

// General API: 300 per hour (generous for normal browsing)
const apiLimiter = createLimiter(
  60 * 60 * 1000,
  300,
  'Rate limit exceeded. Please slow down.'
);

// Image search: 500 per hour (pages load many images at once)
const imageLimiter = createLimiter(
  60 * 60 * 1000,
  500,
  'Image search rate limit exceeded. Please slow down.'
);

// File uploads: 20 per hour (avatar changes, etc.)
const uploadLimiter = createLimiter(
  60 * 60 * 1000,
  20,
  'Upload limit exceeded. Please try again later.'
);

// Place photos: 200 per hour per user (stay within Google's $200/month free tier)
const placePhotoLimiter = createLimiter(
  60 * 60 * 1000,
  200,
  'Place photo rate limit exceeded. Please slow down.'
);

module.exports = { authLimiter, aiLimiter, apiLimiter, imageLimiter, uploadLimiter, placePhotoLimiter };
