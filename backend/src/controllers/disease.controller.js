import { Question } from '../models/Question.js';
import { DISEASES } from '../utils/constants.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

export const diseaseController = {
  /**
   * Get all diseases
   */
  async getDiseases(req, res) {
    try {
      res.status(HTTP_STATUS.OK).json({
        success: true,
        diseases: DISEASES,
      });
    } catch (error) {
      logger.error('Get diseases error:', error.message);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  },

  /**
   * Get questions for a disease
   */
  async getQuestions(req, res) {
    try {
      const { disease } = req.params;

      if (!DISEASES.includes(disease)) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: ERROR_MESSAGES.DISEASE_NOT_FOUND,
        });
      }

      const questions = await Question.find({ disease }).sort({ questionNumber: 1 });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        disease,
        questionCount: questions.length,
        questions,
      });
    } catch (error) {
      logger.error('Get questions error:', error.message);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  },

  /**
   * Create a question (admin only)
   */
  async createQuestion(req, res) {
    try {
      const { disease, questionNumber, question, questionType, options, category, severity } = req.body;

      const newQuestion = new Question({
        disease,
        questionNumber,
        question,
        questionType,
        options,
        category,
        severity,
      });

      await newQuestion.save();

      logger.info(`Question created for disease: ${disease}`);

      res.status(201).json({
        success: true,
        message: 'Question created successfully',
        question: newQuestion,
      });
    } catch (error) {
      logger.error('Create question error:', error.message);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  },

  /**
   * Update a question (admin only)
   */
  async updateQuestion(req, res) {
    try {
      const { questionId } = req.params;
      const updateData = req.body;

      const question = await Question.findByIdAndUpdate(questionId, updateData, {
        new: true,
        runValidators: true,
      });

      if (!question) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Question not found',
        });
      }

      logger.info(`Question updated: ${questionId}`);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Question updated successfully',
        question,
      });
    } catch (error) {
      logger.error('Update question error:', error.message);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  },

  /**
   * Delete a question (admin only)
   */
  async deleteQuestion(req, res) {
    try {
      const { questionId } = req.params;

      const question = await Question.findByIdAndDelete(questionId);

      if (!question) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Question not found',
        });
      }

      logger.info(`Question deleted: ${questionId}`);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Question deleted successfully',
      });
    } catch (error) {
      logger.error('Delete question error:', error.message);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  },
};
