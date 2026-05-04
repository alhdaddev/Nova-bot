const mongoose = require('mongoose');
const logger = require('../utils/logger');

// ─── Connection ───────────────────────────────────────
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message);
    logger.warn('Running without database - some features disabled');
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected. Reconnecting...');
  setTimeout(connectDB, 5000);
});

module.exports = { connectDB };
