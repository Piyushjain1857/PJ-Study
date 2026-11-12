import { sendError } from '../utils/apiResponse.js';
import { hasPermission } from './rolePermissions.js';

/**
 * Middleware factory enforcing fine-grained capability permissions.
 * Verifies that the authenticated user's role grants all specified permissions.
 *
 * @param {...string} requiredPermissions
 * @returns {import('express').RequestHandler}
 */
export function requirePermission(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(
        res,
        'Authentication required before permission verification.',
        401,
        'UNAUTHORIZED'
      );
    }

    const missingPermissions = requiredPermissions.filter(
      (perm) => !hasPermission(req.user.role, perm)
    );

    if (missingPermissions.length > 0) {
      return sendError(
        res,
        'Access denied: you do not hold the required permissions to perform this action.',
        403,
        'FORBIDDEN'
      );
    }

    next();
  };
}

export default requirePermission;
