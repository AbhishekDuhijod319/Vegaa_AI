const config = require('./src/config/env');
const connectDB = require('./src/config/db');
const app = require('./src/app');

const start = async () => {
  // Connect to MongoDB
  await connectDB();

  // Start HTTP server
  const PORT = config.server.port;
  app.listen(PORT, () => {
    console.log(`\n🚀 Vegaa AI Server running on port ${PORT}`);
    console.log(`   Environment: ${config.server.nodeEnv}`);
    console.log(`   Client URL:  ${config.server.clientUrl}`);
    console.log(`   Health:      http://localhost:${PORT}/api/health\n`);
  });
};

start().catch((err) => {
  console.error('❌ Failed to start server:', err.message);
  process.exit(1);
});
