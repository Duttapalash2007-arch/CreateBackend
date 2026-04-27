import express from 'express';
import { diseaseController } from '../controllers/disease.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { adminMiddleware } from '../middlewares/admin.middleware.js';

const router = express.Router();

// Get all diseases (public)
router.get('/', diseaseController.getDiseases);

// Get questions for a disease (public)
router.get('/:disease/questions', diseaseController.getQuestions);

// Admin only routes
router.use(authMiddleware, adminMiddleware);

// Create question
router.post('/:disease/questions', diseaseController.createQuestion);

// Update question
router.put('/questions/:questionId', diseaseController.updateQuestion);

// Delete question
router.delete('/questions/:questionId', diseaseController.deleteQuestion);

export default router;
