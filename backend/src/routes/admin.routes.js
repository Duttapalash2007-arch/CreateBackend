import express from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = express.Router();

// All admin routes require authentication and admin privilege
router.use(authMiddleware, adminMiddleware);

// Get all reports with filtering
router.get('/reports', adminController.getAllReports);

// Get high-risk reports
router.get('/reports/high-risk', adminController.getHighRiskReports);

// Get dashboard statistics
router.get('/dashboard/stats', adminController.getDashboardStats);

// Get SOS alerts
router.get('/sos', adminController.getSosAlerts);

// Update SOS alert status
router.put('/sos/:alertId', adminController.updateSosAlertStatus);

// Update report status
router.put('/reports/:reportId', adminController.updateReportStatus);

// Get user details
router.get('/users/:userId', adminController.getUserDetails);

export default router;
