import { Report } from '../models/Report.js';
import { SosAlert } from '../models/SosAlert.js';
import { User } from '../models/User.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

const PENDING_SOS_STATUSES = ['active', 'pending'];
const FINAL_SOS_STATUSES = ['approved', 'cancelled'];

export const adminController = {
  /**
   * Get all reports with filtering
   */
  async getAllReports(req, res) {
    try {
      const { disease, status, isHighRisk, startDate, endDate, limit = 20, page = 1 } = req.query;

      let query = {};

      if (disease) {
        query.disease = disease;
      }
      if (status) {
        query.status = status;
      }
      if (isHighRisk !== undefined) {
        query.isHighRisk = isHighRisk === 'true';
      }

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) {
          query.createdAt.$gte = new Date(startDate);
        }
        if (endDate) {
          query.createdAt.$lte = new Date(endDate);
        }
      }

      const skip = (page - 1) * limit;

      const reports = await Report.find(query)
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Report.countDocuments(query);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        reports,
      });
    } catch (error) {
      logger.error('Get all reports error:', error.message);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  },

  /**
   * Get high-risk reports
   */
  async getHighRiskReports(req, res) {
    try {
      const reports = await Report.find({ isHighRisk: true })
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        count: reports.length,
        reports,
      });
    } catch (error) {
      logger.error('Get high-risk reports error:', error.message);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  },

  /**
   * Get dashboard statistics
   */
  async getDashboardStats(req, res) {
    try {
      const totalReports = await Report.countDocuments();
      const totalUsers = await User.countDocuments();
      const highRiskReports = await Report.countDocuments({ isHighRisk: true });
      const pendingSosAlerts = await SosAlert.countDocuments({
        status: { $in: PENDING_SOS_STATUSES },
      });
      const approvedSosAlerts = await SosAlert.countDocuments({ status: 'approved' });

      const reportsByDisease = await Report.aggregate([
        {
          $group: {
            _id: '$disease',
            count: { $sum: 1 },
          },
        },
      ]);

      const reportsByStatus = await Report.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);

      const reportsLast30Days = await Report.countDocuments({
        createdAt: {
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        stats: {
          totalReports,
          totalUsers,
          highRiskReports,
          activeSosAlerts: pendingSosAlerts,
          pendingSosAlerts,
          approvedSosAlerts,
          reportsLast30Days,
          reportsByDisease,
          reportsByStatus,
        },
      });
    } catch (error) {
      logger.error('Get dashboard stats error:', error.message);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  },

  /**
   * Update report status
   */
  async updateReportStatus(req, res) {
    try {
      const { reportId } = req.params;
      const { status, adminNotes } = req.body;

      const report = await Report.findByIdAndUpdate(
        reportId,
        { status, adminNotes },
        { new: true }
      );

      if (!report) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.REPORT_NOT_FOUND,
        });
      }

      logger.info(`Report status updated: ${reportId}`);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        report,
      });
    } catch (error) {
      logger.error('Update report status error:', error.message);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  },

  /**
   * Get user details
   */
  async getUserDetails(req, res) {
    try {
      const { userId } = req.params;

      const user = await User.findById(userId);
      const reports = await Report.find({ userId }).sort({ createdAt: -1 });

      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.USER_NOT_FOUND,
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        user: user.getPublicProfile(),
        reports,
      });
    } catch (error) {
      logger.error('Get user details error:', error.message);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  },

  /**
   * Get SOS alerts
   */
  async getSosAlerts(req, res) {
    try {
      const alerts = await SosAlert.find()
        .populate('userId', 'firstName lastName email phoneNumber')
        .sort({ createdAt: -1 });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        count: alerts.length,
        alerts,
      });
    } catch (error) {
      logger.error('Get SOS alerts error:', error.message);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  },

  /**
   * Update SOS alert status
   */
  async updateSosAlertStatus(req, res) {
    try {
      const { alertId } = req.params;
      const { status } = req.body;

      if (!FINAL_SOS_STATUSES.includes(status)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Invalid SOS status. Use approved or cancelled.',
        });
      }

      const alert = await SosAlert.findByIdAndUpdate(
        alertId,
        { status },
        { new: true }
      ).populate('userId', 'firstName lastName email phoneNumber');

      if (!alert) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.SOS_ALERT_NOT_FOUND,
        });
      }

      logger.info(`SOS alert status updated: ${alertId} -> ${status}`);

      return res.status(HTTP_STATUS.OK).json({
        success: true,
        alert,
      });
    } catch (error) {
      logger.error('Update SOS alert status error:', error.message);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  },
};
