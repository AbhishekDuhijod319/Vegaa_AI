const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const required = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error(`❌ Missing required env vars: ${missing.join(', ')}`);
  console.error('   Copy .env.example → .env and fill in values.');
  process.exit(1);
}

module.exports = {
  mongodb: { uri: process.env.MONGODB_URI },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
    refreshExpiryMs: 7 * 24 * 60 * 60 * 1000,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  },
  apis: {
    gemini: process.env.GEMINI_API_KEY || '',
    pexels: process.env.PEXELS_API_KEY || '',
    googlePlaces: process.env.GOOGLE_PLACES_API_KEY || '',
    openWeather: process.env.OPENWEATHER_API_KEY || '',
    rapidApi: process.env.RAPIDAPI_KEY || '',
  },
  server: {
    port: parseInt(process.env.PORT, 10) || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  },
};
