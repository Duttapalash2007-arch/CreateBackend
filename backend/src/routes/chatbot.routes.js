import express from 'express';
import { chatbotController } from '../controllers/chatbot.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { uploadMiddleware } from '../middlewares/upload.middleware.js';

const router = express.Router();

// All chatbot routes require authentication
router.use(authMiddleware);

// Send chat message
router.post('/message', uploadMiddleware('image'), chatbotController.sendMessage);
router.post('/:reportId/message', uploadMiddleware('image'), chatbotController.sendMessage);

// Get chat history
router.get('/:reportId/history', chatbotController.getChatHistory);

// Clear chat history
router.delete('/:reportId/history', chatbotController.clearChatHistory);

export default router;
