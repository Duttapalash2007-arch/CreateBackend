import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { envConfig } from './config/env.js';
import { logger } from './utils/logger.js';
import { setupChatSocket } from './sockets/chat.socket.js';
import { dailyReportSummaryJob, cleanupOldReportsJob } from './jobs/report.job.js';
import { highRiskAlertJob, pendingReportReminderJob } from './jobs/alert.job.js';

const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

// Setup chat socket handlers
setupChatSocket(io);

// Store io instance in app for later use if needed
app.io = io;

/**
 * Start server
 */
const startServer = async () => {
  try {
    // Connect to database
    logger.info('Connecting to MongoDB...');
    await connectDB();
    logger.info('✓ MongoDB connected');

    // Start scheduled jobs
    logger.info('Starting scheduled jobs...');
    dailyReportSummaryJob();
    cleanupOldReportsJob();
    highRiskAlertJob();
    pendingReportReminderJob();
    logger.info('✓ Scheduled jobs started');

    // Start server
    server.listen(envConfig.port, () => {
      logger.info(`✓ Server running on port ${envConfig.port}`);
      logger.info(`Environment: ${envConfig.nodeEnv}`);
      logger.info('-----------------------------------');
      logger.info('Healthcare Assistant Backend Ready');
      logger.info('-----------------------------------');
    });
  } catch (error) {
    logger.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

/**
 * Handle process termination
 */
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
startServer();
