import rateLimit from 'express-rate-limit';
import env from '../../config/env.js';
import { sendError } from '../../utils/apiResponse.js';
import { verifyAccessToken } from '../../services/tokens/token.service.js';

/**
 * Authentication middleware validating short-lived JWT access tokens.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function authenticate(req, res, next) {
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

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role
    };
    next();
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
