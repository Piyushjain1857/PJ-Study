import { Router } from 'express';
import authController from './auth.controller.js';
import {
  validateRegister,
  validateLogin,
  validateVerifyEmail,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword
} from './auth.validation.js';
import { authenticate, strictAuthLimiter, generalAuthLimiter } from './auth.middleware.js';

const router = Router();

/**
 * Public authentication routes
 */
router.post('/register', strictAuthLimiter, validateRegister, authController.register);
router.post('/login', strictAuthLimiter, validateLogin, authController.login);
router.post('/refresh', generalAuthLimiter, authController.refresh);
router.post('/logout', authController.logout);

// Email verification (accepts both GET query and POST payload)
router.get('/verify-email', generalAuthLimiter, validateVerifyEmail, authController.verifyEmail);
router.post('/verify-email', generalAuthLimiter, validateVerifyEmail, authController.verifyEmail);
router.post(
  '/resend-verification',
  strictAuthLimiter,
  validateForgotPassword,
  authController.resendVerification
);

// Password recovery
router.post(
  '/forgot-password',
  strictAuthLimiter,
  validateForgotPassword,
  authController.forgotPassword
);
router.post(
  '/reset-password',
  strictAuthLimiter,
  validateResetPassword,
  authController.resetPassword
);

/**
 * Authenticated user account routes
 */
router.get('/me', authenticate, authController.getMe);
router.post(
  '/change-password',
  authenticate,
  validateChangePassword,
  authController.changePassword
);

export default router;
