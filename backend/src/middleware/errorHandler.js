const logger = require('../utils/logger');

/**
 * Global error handler — catches all unhandled errors.
 * Must be registered LAST in Express middleware chain.
 */
const errorHandler = (err, req, res, _next) => {
  // Use debug-level for expected auth failures (401) to reduce noise
  const status = err.status || 500;
  if (status < 500) {
    logger.debug(`${req.method} ${req.path} → ${err.message}`);
  } else {
    logger.error(`${req.method} ${req.path} →`, err.message);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Validation failed', details: messages });
  }

  // Mongoose duplicate key (e.g. duplicate email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ error: `${field} already exists.` });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Invalid token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token expired.', code: 'TOKEN_EXPIRED' });
  }

  // CORS errors
  if (err.message?.includes('CORS')) {
    return res.status(403).json({ error: err.message });
  }

  // Default: internal server error (don't leak internals in production)
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    error: isProduction ? 'Internal server error.' : err.message,
  });
};

module.exports = errorHandler;
