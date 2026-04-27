import { Report } from '../models/Report.js';
import { AIRouter } from '../services/ai/aiRouter.service.js';
import { buildChatbotPrompt, buildReportChatContext } from '../utils/promptBuilder.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

export const chatbotController = {
  /**
   * Send chat message and get AI response
   */
  async sendMessage(req, res) {
    try {
      const reportId = req.params.reportId || req.body.reportId;
      const { message = '' } = req.body;
      const userId = req.user.id;
      const uploadedImage = req.file;
      const textMessage = String(message || '').trim();
      let imageSummary = '';

      if (uploadedImage && !uploadedImage.mimetype?.startsWith('image/')) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Please upload an image file for chat analysis.',
        });
      }

      if (uploadedImage) {
        imageSummary = await AIRouter.analyzeUploadedImage({
          imagePath: uploadedImage.path,
          mimeType: uploadedImage.mimetype,
        });
      }

      const composedUserMessage = [
        textMessage,
        imageSummary ? `Uploaded image summary: ${imageSummary}` : '',
      ]
        .filter(Boolean)
        .join('\n');

      if (!composedUserMessage) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Message or image is required.',
        });
      }

      if (!reportId) {
        const prompt = buildChatbotPrompt({
          disease: 'General Health',
          previousAnalysis: 'No prior report available. Provide general guidance only.',
          userMessage: composedUserMessage,
          imageSummary,
          conversationHistory: [],
        });
        const aiResponse = await AIRouter.generateChatResponse(prompt);

        return res.status(HTTP_STATUS.OK).json({
          success: true,
          response: aiResponse,
          imageSummary,
          chatHistory: [
            { sender: 'user', message: textMessage || 'Uploaded an image for analysis', timestamp: new Date() },
            ...(imageSummary ? [{ sender: 'ai', message: `Image observation: ${imageSummary}`, timestamp: new Date() }] : []),
            { sender: 'ai', message: aiResponse, timestamp: new Date() },
          ],
        });
      }

      // Get report
      const report = await Report.findById(reportId);

      if (!report) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.REPORT_NOT_FOUND,
        });
      }

      // Check authorization
      if (report.userId.toString() !== userId && req.user.role !== 'admin') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: ERROR_MESSAGES.UNAUTHORIZED_ACCESS,
        });
      }

      // Add user message to chat history
      report.chatHistory.push({
        sender: 'user',
        message: textMessage || 'Uploaded an image for analysis',
        timestamp: new Date(),
      });

      if (imageSummary) {
        report.chatHistory.push({
          sender: 'ai',
          message: `Image observation: ${imageSummary}`,
          timestamp: new Date(),
        });
      }

      // Build prompt with context
      const prompt = buildChatbotPrompt({
        userMessage: composedUserMessage,
        imageSummary,
        ...buildReportChatContext(report),
      });

      // Get AI response
      const aiResponse = await AIRouter.generateChatResponse(prompt);

      // Add AI response to chat history
      report.chatHistory.push({
        sender: 'ai',
        message: aiResponse,
        timestamp: new Date(),
      });

      await report.save();

      logger.info(`Chat message processed for report: ${reportId}`);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        response: aiResponse,
        imageSummary,
        chatHistory: report.chatHistory,
      });
    } catch (error) {
      logger.error('Chat error:', error.message);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  },

  /**
   * Get chat history
   */
  async getChatHistory(req, res) {
    try {
      const { reportId } = req.params;
      const userId = req.user.id;

      const report = await Report.findById(reportId);

      if (!report) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.REPORT_NOT_FOUND,
        });
      }

      // Check authorization
      if (report.userId.toString() !== userId && req.user.role !== 'admin') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: ERROR_MESSAGES.UNAUTHORIZED_ACCESS,
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        chatHistory: report.chatHistory,
      });
    } catch (error) {
      logger.error('Get chat history error:', error.message);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  },

  /**
   * Clear chat history
   */
  async clearChatHistory(req, res) {
    try {
      const { reportId } = req.params;
      const userId = req.user.id;

      const report = await Report.findById(reportId);

      if (!report) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.REPORT_NOT_FOUND,
        });
      }

      // Check authorization
      if (report.userId.toString() !== userId && req.user.role !== 'admin') {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: ERROR_MESSAGES.UNAUTHORIZED_ACCESS,
        });
      }

      report.chatHistory = [];
      await report.save();

      logger.info(`Chat history cleared for report: ${reportId}`);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Chat history cleared',
      });
    } catch (error) {
      logger.error('Clear chat history error:', error.message);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  },
};
