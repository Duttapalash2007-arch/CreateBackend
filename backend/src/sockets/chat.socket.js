import jwt from 'jsonwebtoken';
import { envConfig } from '../config/env.js';
import { AIRouter } from '../services/ai/aiRouter.service.js';
import { buildChatbotPrompt, buildReportChatContext } from '../utils/promptBuilder.js';
import { Report } from '../models/Report.js';
import { logger } from '../utils/logger.js';
import { ERROR_MESSAGES, SOCKET_EVENTS } from '../utils/constants.js';

const emitChatError = (socket, message, requestId) => {
  socket.emit(SOCKET_EVENTS.ERROR, {
    message,
    requestId,
    timestamp: new Date(),
  });
};

const canAccessReport = (report, user) =>
  report?.userId?.toString?.() === user?.id || user?.role === 'admin';

export const setupChatSocket = (io) => {
  io.use((socket, next) => {
    try {
      const authToken = socket.handshake.auth?.token;
      const headerToken = socket.handshake.headers?.authorization?.split(' ')[1];
      const token = authToken || headerToken;

      if (!token) {
        return next(new Error(ERROR_MESSAGES.INVALID_TOKEN));
      }

      socket.user = jwt.verify(token, envConfig.jwtSecret);
      next();
    } catch (error) {
      logger.error('Socket auth error:', error.message);
      next(new Error(ERROR_MESSAGES.INVALID_TOKEN));
    }
  });

  io.on(SOCKET_EVENTS.CONNECT, (socket) => {
    logger.info(`User connected: ${socket.id}`);

    // Join room for specific report
    socket.on('joinRoom', async (reportId) => {
      try {
        if (!reportId) {
          return;
        }

        const report = await Report.findById(reportId).select('userId');
        if (!report) {
          return emitChatError(socket, ERROR_MESSAGES.REPORT_NOT_FOUND);
        }

        if (!canAccessReport(report, socket.user)) {
          return emitChatError(socket, ERROR_MESSAGES.UNAUTHORIZED_ACCESS);
        }

        socket.join(reportId);
        logger.info(`User ${socket.id} joined room ${reportId}`);
      } catch (error) {
        logger.error('Join room error:', error.message);
        emitChatError(socket, 'Unable to open this chat room right now.');
      }
    });

    // Handle incoming chat message
    socket.on(SOCKET_EVENTS.CHAT_MESSAGE, async (data) => {
      const { reportId, message, requestId } = data || {};
      const textMessage = String(message || '').trim();

      try {
        if (!textMessage) {
          return emitChatError(socket, 'Message is required.', requestId);
        }

        if (!reportId) {
          const prompt = buildChatbotPrompt({
            disease: 'General Health',
            previousAnalysis: 'No prior report available. Provide website help, general guidance, or general informational help as needed.',
            userMessage: textMessage,
            conversationHistory: [],
          });
          const aiResponse = await AIRouter.generateChatResponse(prompt);

          socket.emit(SOCKET_EVENTS.CHAT_RESPONSE, {
            requestId,
            sender: 'ai',
            message: aiResponse,
            timestamp: new Date(),
          });

          return;
        }

        const report = await Report.findById(reportId);
        if (!report) {
          return emitChatError(socket, ERROR_MESSAGES.REPORT_NOT_FOUND, requestId);
        }

        if (!canAccessReport(report, socket.user)) {
          return emitChatError(socket, ERROR_MESSAGES.UNAUTHORIZED_ACCESS, requestId);
        }

        report.chatHistory.push({
          sender: 'user',
          message: textMessage,
          timestamp: new Date(),
        });

        const prompt = buildChatbotPrompt({
          userMessage: textMessage,
          ...buildReportChatContext(report),
        });
        const aiResponse = await AIRouter.generateChatResponse(prompt);

        report.chatHistory.push({
          sender: 'ai',
          message: aiResponse,
          timestamp: new Date(),
        });
        await report.save();

        socket.emit(SOCKET_EVENTS.CHAT_RESPONSE, {
          requestId,
          sender: 'ai',
          message: aiResponse,
          reportId,
          timestamp: new Date(),
        });

        logger.info(`Chat response sent for report ${reportId}`);
      } catch (error) {
        logger.error('Chat error:', error.message);
        emitChatError(socket, 'Failed to process your message. Please try again.', requestId);
      }
    });

    // Handle typing indicator
    socket.on(SOCKET_EVENTS.TYPING, (roomId) => {
      socket.to(roomId).emit(SOCKET_EVENTS.TYPING, { userId: socket.id });
    });

    socket.on(SOCKET_EVENTS.STOP_TYPING, (roomId) => {
      socket.to(roomId).emit(SOCKET_EVENTS.STOP_TYPING, { userId: socket.id });
    });

    // Handle disconnect
    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      logger.info(`User disconnected: ${socket.id}`);
    });
  });
};
