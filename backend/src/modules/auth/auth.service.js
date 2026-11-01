import userRepository, { UserRepository } from '../users/user.repository.js';
import authRepository, { AuthRepository } from './auth.repository.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import {
  generateRandomToken,
  hashToken,
  generateAccessToken,
  getRefreshTokenExpiry,
  getEmailVerificationExpiry,
  getPasswordResetExpiry
} from '../../services/tokens/token.service.js';
import emailService, { EmailService } from '../../services/email/email.service.js';

/**
 * Service managing core authentication business logic, session lifecycle, and token security.
 */
export class AuthService {
  /**
   * @param {object} [dependencies]
   * @param {UserRepository} [dependencies.userRepo]
   * @param {AuthRepository} [dependencies.authRepo]
   * @param {EmailService} [dependencies.email]
   */
  constructor({ userRepo = userRepository, authRepo = authRepository, email = emailService } = {}) {
    this.userRepo = userRepo;
    this.authRepo = authRepo;
    this.email = email;
  }

  /**
   * Registers a new student account, hashes the password, and sends email verification.
   *
   * @param {{ name: string, email: string, password: string }} data
   * @returns {Promise<{ user: any, message: string }>}
   */
  async register({ name, email, password }) {
    const normalizedEmail = email.trim().toLowerCase();

    // Check for existing user
    const existingUser = await this.userRepo.findByEmail(normalizedEmail);
    if (existingUser) {
      const error = new Error('An account with this email address already exists');
      error.statusCode = 409;
      error.code = 'EMAIL_ALREADY_EXISTS';
      throw error;
    }

    // Hash password securely
    const passwordHash = await hashPassword(password);

    // Create user in database
    const newUser = await this.userRepo.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'STUDENT',
      isEmailVerified: false,
      isActive: true
    });

    // Generate single-use verification token
    const rawVerificationToken = generateRandomToken();
    const tokenHash = hashToken(rawVerificationToken);
    const expiresAt = getEmailVerificationExpiry();

    await this.authRepo.createEmailVerificationToken({
      userId: newUser.id,
      tokenHash,
      expiresAt
    });

    // Send verification email asynchronously
    this.email
      .sendVerificationEmail({
        to: newUser.email,
        name: newUser.name,
        token: rawVerificationToken
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Failed to dispatch verification email:', err);
      });

    return {
      user: newUser,
      message: 'Account created successfully. Please check your email to verify your account.'
    };
  }

  /**
   * Authenticates user credentials and issues access & refresh tokens.
   *
   * @param {{ email: string, password: string }} data
   * @returns {Promise<{ user: any, accessToken: string, refreshToken: string }>}
   */
  async login({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();

    // Fetch user including sensitive passwordHash
    const user = await this.userRepo.findByEmail(normalizedEmail, true);
    if (!user) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    if (!user.isActive) {
      const error = new Error('Your account is currently deactivated. Please contact support.');
      error.statusCode = 403;
      error.code = 'ACCOUNT_DEACTIVATED';
      throw error;
    }

    // Verify password hash
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      const error = new Error('Invalid email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Issue tokens
    const accessToken = generateAccessToken(user);
    const rawRefreshToken = generateRandomToken();
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = getRefreshTokenExpiry();

    await this.authRepo.createSession({
      userId: user.id,
      tokenHash,
      expiresAt
    });

    // Strip passwordHash from user object
    const { passwordHash: _hash, ...safeUser } = user;

    return {
      user: safeUser,
      accessToken,
      refreshToken: rawRefreshToken
    };
  }

  /**
   * Rotates a refresh token session and generates a fresh access token.
   * Implements automatic reuse detection to invalidate stolen sessions.
   *
   * @param {string} rawRefreshToken
   * @returns {Promise<{ user: any, accessToken: string, refreshToken: string }>}
   */
  async refreshSession(rawRefreshToken) {
    if (!rawRefreshToken || typeof rawRefreshToken !== 'string') {
      const error = new Error('Refresh token is required');
      error.statusCode = 401;
      error.code = 'MISSING_REFRESH_TOKEN';
      throw error;
    }

    const tokenHash = hashToken(rawRefreshToken);
    const session = await this.authRepo.findSessionByTokenHash(tokenHash);

    if (!session) {
      const error = new Error('Invalid or expired session');
      error.statusCode = 401;
      error.code = 'INVALID_SESSION';
      throw error;
    }

    // REUSE DETECTION: If session was already revoked, a compromised token is being presented!
    if (session.revokedAt !== null) {
      // Invalidate all active sessions for this user to protect account
      await this.authRepo.revokeAllUserSessions(session.userId);
      const error = new Error(
        'Session reuse detected. For your security, all active sessions have been terminated. Please log in again.'
      );
      error.statusCode = 401;
      error.code = 'TOKEN_REUSE_DETECTED';
      throw error;
    }

    // EXPIRATION CHECK
    if (new Date() > new Date(session.expiresAt)) {
      await this.authRepo.revokeSession(session.id);
      const error = new Error('Session has expired. Please sign in again.');
      error.statusCode = 401;
      error.code = 'SESSION_EXPIRED';
      throw error;
    }

    // ACCOUNT STATUS CHECK
    if (!session.user || !session.user.isActive) {
      const error = new Error('Your account is deactivated.');
      error.statusCode = 403;
      error.code = 'ACCOUNT_DEACTIVATED';
      throw error;
    }

    // ROTATION: generate new token pair
    const newRawRefreshToken = generateRandomToken();
    const newTokenHash = hashToken(newRawRefreshToken);
    const newExpiresAt = getRefreshTokenExpiry();

    await this.authRepo.rotateSession({
      oldSessionId: session.id,
      userId: session.userId,
      newTokenHash,
      expiresAt: newExpiresAt
    });

    const accessToken = generateAccessToken(session.user);

    return {
      user: session.user,
      accessToken,
      refreshToken: newRawRefreshToken
    };
  }

  /**
   * Logs out the user by revoking the provided refresh session.
   *
   * @param {string} [rawRefreshToken]
   * @returns {Promise<{ success: boolean }>}
   */
  async logout(rawRefreshToken) {
    if (rawRefreshToken && typeof rawRefreshToken === 'string') {
      try {
        const tokenHash = hashToken(rawRefreshToken);
        const session = await this.authRepo.findSessionByTokenHash(tokenHash);
        if (session && !session.revokedAt) {
          await this.authRepo.revokeSession(session.id);
        }
      } catch (err) {
        // Non-blocking error logging for logout
        // eslint-disable-next-line no-console
        console.error('Logout revocation error:', err);
      }
    }

    return { success: true };
  }

  /**
   * Verifies account email address using the single-use token.
   *
   * @param {string} rawToken
   * @returns {Promise<{ success: boolean, message: string, user: any }>}
   */
  async verifyEmail(rawToken) {
    const tokenHash = hashToken(rawToken);
    const tokenRecord = await this.authRepo.findEmailVerificationToken(tokenHash);

    if (!tokenRecord || tokenRecord.usedAt !== null) {
      const error = new Error('This verification link is invalid or has already been used.');
      error.statusCode = 400;
      error.code = 'INVALID_OR_USED_TOKEN';
      throw error;
    }

    if (new Date() > new Date(tokenRecord.expiresAt)) {
      const error = new Error('This verification link has expired. Please request a new one.');
      error.statusCode = 400;
      error.code = 'TOKEN_EXPIRED';
      throw error;
    }

    const updatedUser = await this.authRepo.verifyUserEmailAndConsumeToken({
      userId: tokenRecord.userId,
      tokenId: tokenRecord.id
    });

    return {
      success: true,
      message: 'Email address successfully verified.',
      user: updatedUser
    };
  }

  /**
   * Resends verification email for unverified user.
   *
   * @param {string} email
   * @returns {Promise<{ message: string }>}
   */
  async resendVerification(email) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepo.findByEmail(normalizedEmail);

    // Respond with generic success to prevent email enumeration
    if (user && !user.isEmailVerified && user.isActive) {
      const rawToken = generateRandomToken();
      const tokenHash = hashToken(rawToken);
      const expiresAt = getEmailVerificationExpiry();

      await this.authRepo.createEmailVerificationToken({
        userId: user.id,
        tokenHash,
        expiresAt
      });

      this.email
        .sendVerificationEmail({
          to: user.email,
          name: user.name,
          token: rawToken
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('Resend verification email error:', err);
        });
    }

    return {
      message:
        'If an unverified account with that email exists, a fresh verification link has been sent.'
    };
  }

  /**
   * Initiates password reset flow with generic user-facing response.
   *
   * @param {string} email
   * @returns {Promise<{ message: string }>}
   */
  async forgotPassword(email) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userRepo.findByEmail(normalizedEmail);

    if (user && user.isActive) {
      const rawToken = generateRandomToken();
      const tokenHash = hashToken(rawToken);
      const expiresAt = getPasswordResetExpiry();

      await this.authRepo.createPasswordResetToken({
        userId: user.id,
        tokenHash,
        expiresAt
      });

      this.email
        .sendPasswordResetEmail({
          to: user.email,
          name: user.name,
          token: rawToken
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.error('Password reset email dispatch error:', err);
        });
    }

    return {
      message:
        'If an account exists with that email address, password reset instructions have been sent.'
    };
  }

  /**
   * Sets new password using single-use reset token and invalidates all existing sessions.
   *
   * @param {{ token: string, password: string }} data
   * @returns {Promise<{ message: string }>}
   */
  async resetPassword({ token, password }) {
    const tokenHash = hashToken(token);
    const tokenRecord = await this.authRepo.findPasswordResetToken(tokenHash);

    if (!tokenRecord || tokenRecord.usedAt !== null) {
      const error = new Error('Password reset link is invalid or has already been used.');
      error.statusCode = 400;
      error.code = 'INVALID_OR_USED_TOKEN';
      throw error;
    }

    if (new Date() > new Date(tokenRecord.expiresAt)) {
      const error = new Error('Password reset link has expired. Please request a new one.');
      error.statusCode = 400;
      error.code = 'TOKEN_EXPIRED';
      throw error;
    }

    const newPasswordHash = await hashPassword(password);

    await this.authRepo.resetUserPasswordAndConsumeToken({
      userId: tokenRecord.userId,
      tokenId: tokenRecord.id,
      newPasswordHash
    });

    return {
      message: 'Your password has been reset successfully. Please log in with your new password.'
    };
  }

  /**
   * Updates user password after verifying current credentials.
   *
   * @param {{ userId: string, currentPassword: string, newPassword: string }} data
   * @returns {Promise<{ message: string }>}
   */
  async changePassword({ userId, currentPassword, newPassword }) {
    const user = await this.userRepo.findById(userId, true);

    if (!user) {
      const error = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      const error = new Error('Current password does not match');
      error.statusCode = 400;
      error.code = 'INCORRECT_CURRENT_PASSWORD';
      throw error;
    }

    const newPasswordHash = await hashPassword(newPassword);

    await this.userRepo.update(userId, {
      passwordHash: newPasswordHash
    });

    // Revoke all other refresh sessions
    await this.authRepo.revokeAllUserSessions(userId);

    return {
      message: 'Password changed successfully.'
    };
  }
}

export const authService = new AuthService();
export default authService;
