import authService, { AuthService } from './auth.service.js';
import userRepository, { UserRepository } from '../users/user.repository.js';
import env from '../../config/env.js';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';
import { parseDurationToMs } from '../../services/tokens/token.service.js';

const REFRESH_COOKIE_NAME = 'refreshToken';

/**
 * Returns security-hardened options for the refresh token HttpOnly cookie.
 *
 * @returns {import('express').CookieOptions}
 */
export function getRefreshCookieOptions() {
  const maxAge = parseDurationToMs(env.refreshTokenExpiresIn);
  return {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge
  };
}

/**
 * Controller handling HTTP requests for user authentication, token rotation, and profile recovery.
 */
export class AuthController {
  /**
   * @param {object} [dependencies]
   * @param {AuthService} [dependencies.service]
   * @param {UserRepository} [dependencies.userRepo]
   */
  constructor({ service = authService, userRepo = userRepository } = {}) {
    this.service = service;
    this.userRepo = userRepo;
  }

  /**
   * Registers a new student account.
   */
  register = async (req, res, next) => {
    try {
      const result = await this.service.register(req.body);
      return sendSuccess(res, result.user, 201, result.message);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Authenticates credentials, sets HttpOnly refresh cookie, and returns access token.
   */
  login = async (req, res, next) => {
    try {
      const { user, accessToken, refreshToken } = await this.service.login(req.body);

      // Set secure HttpOnly cookie
      res.cookie(REFRESH_COOKIE_NAME, refreshToken, getRefreshCookieOptions());

      return sendSuccess(
        res,
        {
          user,
          accessToken
        },
        200,
        'Logged in successfully'
      );
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Refreshes access token and rotates refresh token using HttpOnly cookie.
   */
  refresh = async (req, res, next) => {
    try {
      const token = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;

      if (!token) {
        return sendError(
          res,
          'No refresh session found. Please sign in.',
          401,
          'MISSING_REFRESH_TOKEN'
        );
      }

      const {
        user,
        accessToken,
        refreshToken: newRefreshToken
      } = await this.service.refreshSession(token);

      // Rotate cookie with new token
      res.cookie(REFRESH_COOKIE_NAME, newRefreshToken, getRefreshCookieOptions());

      return sendSuccess(
        res,
        {
          user,
          accessToken
        },
        200,
        'Session refreshed successfully'
      );
    } catch (err) {
      // Clear invalid cookie on failure
      res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
      return next(err);
    }
  };

  /**
   * Logs out user, invalidating session and clearing HttpOnly cookie.
   */
  logout = async (req, res, next) => {
    try {
      const token = req.cookies?.[REFRESH_COOKIE_NAME] || req.body?.refreshToken;
      await this.service.logout(token);

      res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
      return sendSuccess(res, null, 200, 'Successfully logged out');
    } catch (err) {
      res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
      return next(err);
    }
  };

  /**
   * Verifies account email address.
   */
  verifyEmail = async (req, res, next) => {
    try {
      const token = req.verificationToken;
      const result = await this.service.verifyEmail(token);
      return sendSuccess(res, result.user, 200, result.message);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Resends verification email.
   */
  resendVerification = async (req, res, next) => {
    try {
      const result = await this.service.resendVerification(req.body.email);
      return sendSuccess(res, null, 200, result.message);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Requests a password reset link.
   */
  forgotPassword = async (req, res, next) => {
    try {
      const result = await this.service.forgotPassword(req.body.email);
      return sendSuccess(res, null, 200, result.message);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Resets password using valid token.
   */
  resetPassword = async (req, res, next) => {
    try {
      const result = await this.service.resetPassword(req.body);
      res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
      return sendSuccess(res, null, 200, result.message);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Changes password for authenticated user.
   */
  changePassword = async (req, res, next) => {
    try {
      const result = await this.service.changePassword({
        userId: req.user.id,
        currentPassword: req.body.currentPassword,
        newPassword: req.body.newPassword
      });

      res.clearCookie(REFRESH_COOKIE_NAME, getRefreshCookieOptions());
      return sendSuccess(res, null, 200, result.message);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Returns current authenticated user profile.
   */
  getMe = async (req, res, next) => {
    try {
      const user = await this.userRepo.findById(req.user.id);
      if (!user) {
        return sendError(res, 'User profile not found', 404, 'USER_NOT_FOUND');
      }
      return sendSuccess(res, user, 200);
    } catch (err) {
      return next(err);
    }
  };
}

export const authController = new AuthController();
export default authController;
