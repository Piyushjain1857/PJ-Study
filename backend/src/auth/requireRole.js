import { sendError } from '../utils/apiResponse.js';

/**
 * Middleware factory enforcing specific role membership.
 *
 * @param {...string} allowedRoles
 * @returns {import('express').RequestHandler}
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(
        res,
        'Authentication required before role verification.',
        401,
        'UNAUTHORIZED'
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        'Access denied: your role does not have authorization to perform this action.',
        403,
        'FORBIDDEN'
      );
    }

    next();
  };
}

export default requireRole;
