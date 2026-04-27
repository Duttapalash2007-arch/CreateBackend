import cron from 'node-cron';
import { Report } from '../models/Report.js';
import { logger } from '../utils/logger.js';

/**
 * Daily report summary job
 * Runs every day at 9 AM
 */
export const dailyReportSummaryJob = () => {
  cron.schedule('0 9 * * *', async () => {
    try {
      logger.info('Running daily report summary job...');

      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const dailyReports = await Report.find({
        createdAt: {
          $gte: yesterday,
        },
      });

      const highRiskCount = dailyReports.filter((r) => r.isHighRisk).length;
      const totalCount = dailyReports.length;

      logger.info(`Daily Report: Total=${totalCount}, HighRisk=${highRiskCount}`);

      // TODO: Send summary email to admin
    } catch (error) {
      logger.error('Daily report summary job error:', error.message);
    }
  });
};

/**
 * Clean up old reports job
 * Runs weekly
 */
export const cleanupOldReportsJob = () => {
  cron.schedule('0 0 * * 0', async () => {
    try {
      logger.info('Running cleanup job for old reports...');

      // Delete reports older than 2 years
      const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000);

      const result = await Report.deleteMany({
        createdAt: {
          $lt: twoYearsAgo,
        },
      });

      logger.info(`Cleaned up ${result.deletedCount} old reports`);
    } catch (error) {
      logger.error('Cleanup job error:', error.message);
    }
  });
};
