import { User } from '../models/User.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

export const adminMiddleware = async (req, res, next) => {
  try {
    if (req.user?.role === 'admin' && req.user?.id === 'env-admin') {
      req.admin = {
        _id: 'env-admin',
        email: req.user.email,
        role: 'admin',
      };
      return next();
    }

    const user = await User.findById(req.user.id);

    if (!user || user.role !== 'admin') {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGES.UNAUTHORIZED_ACCESS,
      });
    }

    req.admin = user;
    next();
  } catch (error) {
    logger.error('Admin middleware error:', error.message);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: ERROR_MESSAGES.INTERNAL_ERROR,
    });
  }
};
