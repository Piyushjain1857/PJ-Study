import { verifyAccessToken } from '../services/tokens/token.service.js';
import userRepository from '../modules/users/user.repository.js';
import { sendError } from '../utils/apiResponse.js';

/**
 * Authentication middleware that confirms valid JWT credentials and resolves
 * the current real-time user state (role & active status) directly from the database.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(
      res,
      'Authentication required. Please provide a valid Bearer token.',
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
    // Retrieve latest user state from database to ensure real-time role & active status
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

    // Attach verified user with database-authoritative role
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
 * Optional authentication middleware: populates req.user if valid token provided,
 * otherwise sets req.user to null without returning an HTTP 401 error.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.substring(7).trim();
  try {
    const decoded = verifyAccessToken(token);
    const user = await userRepository.findById(decoded.sub);
    if (user && user.isActive) {
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive
      };
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }
  return next();
}

export default requireAuth;
