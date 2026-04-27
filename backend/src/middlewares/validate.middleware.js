import { body, validationResult } from 'express-validator';
import { GENERAL_ANALYSIS_DISEASE, HTTP_STATUS, SUPPORTED_REPORT_DISEASES } from '../utils/constants.js';

export const validateRequest = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array().map((err) => ({
          field: err.param,
          message: err.msg,
        })),
      });
    }
    next();
  };
};

// Common validations
export const validateRegister = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

export const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const validateReport = [
  body('disease').isIn(SUPPORTED_REPORT_DISEASES).withMessage('Invalid disease'),
  body('symptoms').trim().notEmpty().withMessage('Symptoms description is required'),
  body('disease').custom((value, { req }) => {
    if (value === GENERAL_ANALYSIS_DISEASE && !req.file) {
      throw new Error('Upload a photo or report for the general condition analysis.');
    }
    return true;
  }),
];
