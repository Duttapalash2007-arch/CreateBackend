import express from 'express';
import { userController } from '../controllers/user.controller.js';
import { sosController } from '../controllers/sos.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All user routes require authentication
router.use(authMiddleware);

// Get user profile
router.get('/profile', userController.getProfile);

// Update user profile
router.put('/profile', userController.updateProfile);

// Create SOS alert
router.post('/sos', sosController.createSosAlert);

// Delete user account
router.delete('/account', userController.deleteAccount);

export default router;
