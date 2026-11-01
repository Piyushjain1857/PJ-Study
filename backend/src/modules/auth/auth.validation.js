import { sendError } from '../../utils/apiResponse.js';
import { validatePasswordStrength } from '../../utils/password.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates registration payload.
 */
export function validateRegister(req, res, next) {
  const { name, email, password } = req.body || {};
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  } else if (name.trim().length > 100) {
    errors.push('Name cannot exceed 100 characters');
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required');
  }

  const passwordCheck = validatePasswordStrength(password);
  if (!passwordCheck.isValid) {
    errors.push(...passwordCheck.errors);
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for registration', 422, 'VALIDATION_ERROR', errors);
  }

  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  next();
}

/**
 * Validates login payload.
 */
export function validateLogin(req, res, next) {
  const { email, password } = req.body || {};
  const errors = [];

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required');
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push('Password is required');
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for login', 422, 'VALIDATION_ERROR', errors);
  }

  req.body.email = email.trim().toLowerCase();
  next();
}

/**
 * Validates email verification token.
 */
export function validateVerifyEmail(req, res, next) {
  const token = req.query?.token || req.body?.token;

  if (!token || typeof token !== 'string' || token.trim().length < 10) {
    return sendError(res, 'Valid verification token is required', 400, 'INVALID_TOKEN');
  }

  req.verificationToken = token.trim();
  next();
}

/**
 * Validates forgot password payload.
 */
export function validateForgotPassword(req, res, next) {
  const { email } = req.body || {};

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return sendError(res, 'A valid email address is required', 422, 'VALIDATION_ERROR', [
      'A valid email address is required'
    ]);
  }

  req.body.email = email.trim().toLowerCase();
  next();
}

/**
 * Validates reset password payload.
 */
export function validateResetPassword(req, res, next) {
  const { token, password } = req.body || {};
  const errors = [];

  if (!token || typeof token !== 'string' || token.trim().length < 10) {
    errors.push('A valid reset token is required');
  }

  const passwordCheck = validatePasswordStrength(password);
  if (!passwordCheck.isValid) {
    errors.push(...passwordCheck.errors);
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for password reset', 422, 'VALIDATION_ERROR', errors);
  }

  req.body.token = token.trim();
  next();
}

/**
 * Validates change password payload.
 */
export function validateChangePassword(req, res, next) {
  const { currentPassword, newPassword } = req.body || {};
  const errors = [];

  if (!currentPassword || typeof currentPassword !== 'string') {
    errors.push('Current password is required');
  }

  const passwordCheck = validatePasswordStrength(newPassword);
  if (!passwordCheck.isValid) {
    errors.push(...passwordCheck.errors);
  }

  if (currentPassword === newPassword) {
    errors.push('New password cannot be identical to current password');
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for password update', 422, 'VALIDATION_ERROR', errors);
  }

  next();
}
