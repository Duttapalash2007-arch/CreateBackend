import { logger } from '../utils/logger.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';

const getRouteSuggestion = (req) => {
  const decodedUrl = decodeURIComponent(req.originalUrl || '');
  const normalizedUrl = decodedUrl.replace(/\s+/g, '').toLowerCase();

  if (normalizedUrl.includes('/api/auth/login') || normalizedUrl.includes('/auth/login')) {
    return {
      hint: 'Login endpoint requires POST and a JSON body with email and password.',
      suggestedRoute: decodedUrl.startsWith('/api/') ? '/api/auth/login' : '/auth/login',
    };
  }

  return null;
};

export const errorMiddleware = (error, req, res, next) => {
  logger.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
  });

  // Validation errors
  if (error.name === 'ValidationError') {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(error.errors).map((err) => err.message),
    });
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGES.INVALID_TOKEN,
    });
  }

  // Default error
  res.status(error.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: error.message || ERROR_MESSAGES.INTERNAL_ERROR,
  });
};

export const notFoundMiddleware = (req, res) => {
  const suggestion = getRouteSuggestion(req);

  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    ...(suggestion && suggestion),
  });
};
