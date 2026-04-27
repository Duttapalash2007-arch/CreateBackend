import cron from 'node-cron';
import { Report } from '../models/Report.js';
import { EmailService } from '../services/email/email.service.js';
import { logger } from '../utils/logger.js';
import { envConfig } from '../config/env.js';

/**
 * Alert for uncompleted high-risk reports
 * Runs every 6 hours
 */
export const highRiskAlertJob = () => {
  cron.schedule('0 */6 * * *', async () => {
    try {
      logger.info('Running high-risk alert job...');

      const highRiskReports = await Report.find({
        isHighRisk: true,
        status: { $ne: 'completed' },
      }).populate('userId', 'email firstName');

      for (const report of highRiskReports) {
        try {
          await EmailService.sendHighRiskAlert(envConfig.adminEmail, {
            disease: report.disease,
            aiAnalysis: report.aiAnalysis,
            userEmail: report.userId.email,
            reportId: report._id,
          });
        } catch (error) {
          logger.warn(`Failed to send alert for report ${report._id}:`, error.message);
        }
      }

      logger.info(`Sent ${highRiskReports.length} high-risk alerts`);
    } catch (error) {
      logger.error('High-risk alert job error:', error.message);
    }
  });
};

/**
 * Reminder for pending reports
 * Runs daily at 10 AM
 */
export const pendingReportReminderJob = () => {
  cron.schedule('0 10 * * *', async () => {
    try {
      logger.info('Running pending report reminder job...');

      const pendingReports = await Report.find({
        status: 'pending',
      }).populate('userId', 'email firstName');

      for (const report of pendingReports) {
        try {
          // Send reminder to user
          // TODO: Implement reminder email sending
          logger.info(`Reminder sent for pending report: ${report._id}`);
        } catch (error) {
          logger.warn(`Failed to send reminder for report ${report._id}:`, error.message);
        }
      }
    } catch (error) {
      logger.error('Pending report reminder job error:', error.message);
    }
  });
};
