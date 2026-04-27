import app from '../src/app.js';
import { connectDB } from '../src/config/db.js';
import { logger } from '../src/utils/logger.js';

let dbConnectionPromise;

const ensureDatabaseConnection = () => {
  if (!dbConnectionPromise) {
    dbConnectionPromise = connectDB().catch((error) => {
      dbConnectionPromise = null;
      throw error;
    });
  }

  return dbConnectionPromise;
};

export default async function handler(req, res) {
  try {
    if (!['/health', '/api'].includes(req.url)) {
      await ensureDatabaseConnection();
    }
  } catch (error) {
    logger.error('Failed to prepare Vercel request:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Database connection failed',
    });
  }

  return app(req, res);
}
