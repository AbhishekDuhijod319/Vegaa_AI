const config = require('./env');

/**
 * Build the allowed-origins list.
 * CLIENT_URL can be a single URL or comma-separated list:
 *   CLIENT_URL=https://vegaa.vercel.app,https://vegaa-git-main.vercel.app
 */
const buildAllowedOrigins = () => {
  const origins = new Set([
    'http://localhost:5173',
    'http://localhost:3000',
  ]);

  if (config.server.clientUrl) {
    config.server.clientUrl
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean)
      .forEach((u) => origins.add(u));
  }

  return [...origins];
};

const allowedOrigins = buildAllowedOrigins();

const corsOptions = {
  origin: function (origin, callback) {
    // Allow server-to-server / curl / health-check requests (no origin header)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS not allowed for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
};

module.exports = corsOptions;
