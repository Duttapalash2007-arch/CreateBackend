import { User } from '../models/User.js';
import { SosAlert } from '../models/SosAlert.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';
import { logger } from '../utils/logger.js';
import { envConfig } from '../config/env.js';
import { EmailService } from '../services/email/email.service.js';

const buildSosMessage = (user, sourcePage, countdownSeconds) => {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Unknown User';
  const phone = user.phoneNumber || 'Not provided';
  const address = [
    user.address?.street,
    user.address?.city,
    user.address?.state,
    user.address?.zipCode,
    user.address?.country,
  ]
    .filter(Boolean)
    .join(', ') || 'Not provided';

  return `SOS alert triggered automatically after ${countdownSeconds} seconds. Patient: ${fullName}. Email: ${user.email}. Phone: ${phone}. Source: ${sourcePage}. Address: ${address}.`;
};

export const sosController = {
  async createSosAlert(req, res) {
    try {
      const { sourcePage = 'home', countdownSeconds = 15 } = req.body;
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.USER_NOT_FOUND,
        });
      }

      const message = buildSosMessage(user, sourcePage, countdownSeconds);
      const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Unknown User';

      const alert = await SosAlert.create({
        userId: user._id,
        name,
        email: user.email,
        phoneNumber: user.phoneNumber || '',
        message,
        sourcePage,
        countdownSeconds,
      });

      if (envConfig.adminEmail) {
        try {
          await EmailService.sendSosAlert(envConfig.adminEmail, {
            name,
            email: user.email,
            phoneNumber: user.phoneNumber || 'Not provided',
            message,
            sourcePage,
            triggeredAt: alert.triggeredAt,
          });
        } catch (emailError) {
          logger.warn('Failed to send SOS alert email:', emailError.message);
        }
      }

      logger.info(`SOS alert created for user ${user.email}`);

      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        alert,
      });
    } catch (error) {
      logger.error('Create SOS alert error:', error.message);
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  },
};
