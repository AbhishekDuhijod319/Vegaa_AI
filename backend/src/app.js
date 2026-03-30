const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const corsOptions = require('./config/cors');
const errorHandler = require('./middleware/errorHandler');
const { getCacheStats } = require('./utils/cache');

// Route imports
const authRoutes = require('./routes/auth.routes');
const tripRoutes = require('./routes/trip.routes');
const aiRoutes = require('./routes/ai.routes');
const imageRoutes = require('./routes/image.routes');
const placesRoutes = require('./routes/places.routes');
const weatherRoutes = require('./routes/weather.routes');

const app = express();

// ─── Global Middleware ──────────────────────────────
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Request logging (skip in test)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Health Check ───────────────────────────────────
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    cache: getCacheStats(),
  });
});

// ─── API Routes ─────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/places', placesRoutes);
app.use('/api/weather', weatherRoutes);

// ─── 404 Handler ────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ─── Global Error Handler (must be last) ────────────
app.use(errorHandler);

module.exports = app;
