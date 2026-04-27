import express from 'express';
import { reportController } from '../controllers/report.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { uploadMiddleware } from '../middlewares/upload.middleware.js';
import { validateRequest, validateReport } from '../middlewares/validate.middleware.js';

const router = express.Router();

// All report routes require authentication
router.use(authMiddleware);

// Create report
router.post(
  '/',
  uploadMiddleware('document'),
  validateRequest(validateReport),
  reportController.createReport
);

// Get user's reports
router.get('/', reportController.getUserReports);

// Get specific report
router.get('/:reportId', reportController.getReport);

// Update report
router.put('/:reportId', reportController.updateReport);

// Delete report
router.delete('/:reportId', reportController.deleteReport);

export default router;
