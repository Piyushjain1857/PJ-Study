import rateLimit from 'express-rate-limit';
import env from '../../config/env.js';
import { sendError } from '../../utils/apiResponse.js';
import { verifyAccessToken } from '../../services/tokens/token.service.js';
import userRepository from '../users/user.repository.js';

/**
 * Authentication middleware validating short-lived JWT access tokens and database active status.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(
      res,
      'Authentication required. Missing or malformed Bearer token.',
      401,
      'UNAUTHORIZED'
    );
  }

  const token = authHeader.substring(7).trim();

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(
        res,
        'Access token has expired. Please refresh your session.',
        401,
        'TOKEN_EXPIRED'
      );
    }
    return sendError(res, 'Invalid or corrupted access token.', 401, 'INVALID_TOKEN');
  }

  try {
    const user = await userRepository.findById(decoded.sub);
    if (!user) {
      return sendError(res, 'User account no longer exists.', 401, 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      return sendError(
        res,
        'Your academic account has been suspended. Please contact platform administration.',
        403,
        'ACCOUNT_SUSPENDED'
      );
    }

    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive
    };
    next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Role-based authorization middleware.
 *
 * @param {...string} allowedRoles
 * @returns {import('express').RequestHandler}
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(
        res,
        'Authentication required before checking permissions.',
        401,
        'UNAUTHORIZED'
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, 'Access denied: insufficient academic permissions.', 403, 'FORBIDDEN');
    }

    next();
  };
}

/**
 * Rate limiter for sensitive operations (login, registration, password reset).
 * Enforces strict limits in production (10 req/15 min) while remaining permissive in local development.
 */
export const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.isProduction ? 10 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isDevelopment,
  handler: (req, res) => {
    return sendError(
      res,
      'Too many authentication attempts. Please try again after 15 minutes.',
      429,
      'RATE_LIMIT_EXCEEDED'
    );
  }
});

/**
 * General rate limiter for standard authentication endpoints (session refresh, status).
 */
export const generalAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.isProduction ? 60 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.isDevelopment,
  handler: (req, res) => {
    return sendError(
      res,
      'Too many requests to authentication services. Please slow down.',
      429,
      'RATE_LIMIT_EXCEEDED'
    );
  }
});

// Centralized RBAC exports for compatibility
export { requireAuth } from '../../auth/requireAuth.js';
export { requireRole } from '../../auth/requireRole.js';
export { requirePermission } from '../../auth/requirePermission.js';
export { requireNoteOwnership } from '../../auth/ownership.js';
export { PERMISSIONS } from '../../auth/permissions.js';
export { ROLES } from '../../auth/rolePermissions.js';
