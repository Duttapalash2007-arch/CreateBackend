import express from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest, validateRegister, validateLogin } from '../middlewares/validate.middleware.js';
import { HTTP_STATUS } from '../utils/constants.js';

const router = express.Router();
const loginPaths = ['/login', '/log-in', '/log in', '/signin', '/sign-in'];

const methodNotAllowed = (endpoint, allowedMethod, exampleBody) => (req, res) => {
  res.status(HTTP_STATUS.METHOD_NOT_ALLOWED).json({
    success: false,
    message: `Use ${allowedMethod} ${endpoint} instead of ${req.method} ${req.originalUrl}`,
    allowedMethod,
    endpoint,
    exampleBody,
  });
};

// Register
router.post('/register', validateRequest(validateRegister), authController.register);

// Login
router.post(loginPaths, validateRequest(validateLogin), authController.login);
router.get(
  loginPaths,
  methodNotAllowed('/api/auth/login', 'POST', {
    email: 'test@test.com',
    password: 'test@123',
  })
);

// Logout
router.post('/logout', authMiddleware, authController.logout);

export default router;
