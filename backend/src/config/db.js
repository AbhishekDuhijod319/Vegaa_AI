const mongoose = require('mongoose');
const config = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodb.uri, {
      serverSelectionTimeoutMS: 10000, // 10s timeout for initial connection
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    if (error.message.includes('whitelist') || error.message.includes('Could not connect')) {
      console.error('');
      console.error('   ╔══════════════════════════════════════════════════╗');
      console.error('   ║  Your IP is not whitelisted in MongoDB Atlas.   ║');
      console.error('   ║                                                  ║');
      console.error('   ║  1. Go to https://cloud.mongodb.com             ║');
      console.error('   ║  2. Network Access → Add IP Address             ║');
      console.error('   ║  3. Click "Allow Access from Anywhere"          ║');
      console.error('   ║  4. Restart this server                         ║');
      console.error('   ╚══════════════════════════════════════════════════╝');
      console.error('');
    }
    if (config.server.nodeEnv === 'production') {
      process.exit(1);
    } else {
      console.warn('⚠️  Server starting without DB (dev mode). DB calls will fail.');
    }
  }

  mongoose.connection.on('error', (err) => {
    console.error(`MongoDB runtime error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Attempting reconnection...');
  });
};

module.exports = connectDB;

