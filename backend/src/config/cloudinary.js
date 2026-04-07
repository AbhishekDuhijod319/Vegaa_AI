const cloudinary = require('cloudinary').v2;
const config = require('./env');
const logger = require('../utils/logger');

// ─── SDK Initialization ────────────────────────────────
cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
  secure: true,
});

// Verify connectivity on first import
(async () => {
  try {
    if (config.cloudinary.cloudName) {
      await cloudinary.api.ping();
      logger.info(`☁️  Cloudinary connected — cloud: ${config.cloudinary.cloudName}`);
    } else {
      logger.warn('Cloudinary credentials not configured. Image uploads disabled.');
    }
  } catch (err) {
    logger.error('Cloudinary connection failed:', err.message);
  }
})();

module.exports = cloudinary;
