import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { envConfig } from '../config/env.js';
import { HTTP_STATUS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '../utils/constants.js';
import { logger } from '../utils/logger.js';
import { EmailService } from '../services/email/email.service.js';

export const authController = {
  /**
   * Register new user
   */
  async register(req, res) {
    try {
      const { firstName, lastName, email, password, age, gender } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message: ERROR_MESSAGES.USER_ALREADY_EXISTS,
        });
      }

      // Create new user
      const user = new User({
        firstName,
        lastName,
        email,
        password,
        age,
        gender,
      });

      await user.save();

      // Send welcome email
      try {
        await EmailService.sendWelcomeEmail(email, firstName);
      } catch (emailError) {
        logger.warn('Failed to send welcome email:', emailError.message);
      }

      // Generate JWT token
      const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, envConfig.jwtSecret, {
        expiresIn: envConfig.jwtExpire,
      });

      logger.info(`User registered: ${email}`);

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: SUCCESS_MESSAGES.USER_REGISTERED,
        token,
        user: user.getPublicProfile(),
      });
    } catch (error) {
      logger.error('Registration error:', error.message);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  },

  /**
   * Login user
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (
        email?.toLowerCase() === envConfig.adminEmail?.toLowerCase() &&
        password === envConfig.adminPassword
      ) {
        const adminUser = {
          _id: 'env-admin',
          firstName: 'Dev',
          lastName: 'Rush',
          email: envConfig.adminEmail,
          role: 'admin',
          isActive: true,
        };

        const token = jwt.sign({ id: adminUser._id, email: adminUser.email, role: adminUser.role }, envConfig.jwtSecret, {
          expiresIn: envConfig.jwtExpire,
        });

        logger.info(`Environment admin logged in: ${email}`);

        return res.status(HTTP_STATUS.OK).json({
          success: true,
          message: SUCCESS_MESSAGES.LOGIN_SUCCESSFUL,
          token,
          user: adminUser,
        });
      }

      // Find user
      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.comparePassword(password))) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: ERROR_MESSAGES.INVALID_CREDENTIALS,
        });
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate JWT token
      const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, envConfig.jwtSecret, {
        expiresIn: envConfig.jwtExpire,
      });

      logger.info(`User logged in: ${email}`);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        message: SUCCESS_MESSAGES.LOGIN_SUCCESSFUL,
        token,
        user: user.getPublicProfile(),
      });
    } catch (error) {
      logger.error('Login error:', error.message);
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: ERROR_MESSAGES.INTERNAL_ERROR,
      });
    }
  },

  /**
   * Logout user
   */
  async logout(req, res) {
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Logged out successfully',
    });
  },
};
