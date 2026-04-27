import { User } from '../models/User.js';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../utils/constants.js';
import { logger } from '../utils/logger.js';

export const userController = {
  /**
   * Get user profile
   */
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.USER_NOT_FOUND,
        });
      }

      res.status(HTTP_STATUS.OK).json({
        success: true,
        user: user.getPublicProfile(),
      });
    } catch (error) {
      logger.error('Get profile error:', error.message);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(req, res) {
    try {
      const { firstName, lastName, age, gender, phoneNumber, address, allergies, medicalHistory } = req.body;

      const user = await User.findByIdAndUpdate(
        req.user.id,
        {
          firstName,
          lastName,
          age,
          gender,
          phoneNumber,
          address,
          allergies,
          medicalHistory,
        },
        { new: true, runValidators: true }
      );

      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.USER_NOT_FOUND,
        });
      }

      logger.info(`User profile updated: ${user.email}`);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Profile updated successfully',
        user: user.getPublicProfile(),
      });
    } catch (error) {
      logger.error('Update profile error:', error.message);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  },

  /**
   * Delete user account
   */
  async deleteAccount(req, res) {
    try {
      const user = await User.findByIdAndDelete(req.user.id);

      if (!user) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: ERROR_MESSAGES.USER_NOT_FOUND,
        });
      }

      logger.info(`User account deleted: ${user.email}`);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: 'Account deleted successfully',
      });
    } catch (error) {
      logger.error('Delete account error:', error.message);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  },
};
