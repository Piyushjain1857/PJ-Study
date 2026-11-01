import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import env from '../../config/env.js';

/**
 * Parses duration strings (e.g. '15m', '24h', '7d', '60s') into milliseconds.
 *
 * @param {string|number} duration
 * @returns {number} Milliseconds
 */
export function parseDurationToMs(duration) {
  if (typeof duration === 'number') {
    return duration * 1000;
  }
  if (!duration || typeof duration !== 'string') {
    return 15 * 60 * 1000; // Default 15 minutes
  }

  const match = duration.trim().match(/^(\d+)([smhdwy]?)$/i);
  if (!match) {
    const parsed = parseInt(duration, 10);
    return isNaN(parsed) ? 15 * 60 * 1000 : parsed * 1000;
  }

  const value = parseInt(match[1], 10);
  const unit = (match[2] || 's').toLowerCase();

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    case 'w':
      return value * 7 * 24 * 60 * 60 * 1000;
    case 'y':
      return value * 365 * 24 * 60 * 60 * 1000;
    default:
      return value * 1000;
  }
}

/**
 * Generates a cryptographically strong random token string (hex format).
 *
 * @param {number} [bytes=32]
 * @returns {string} 64-char hex string (when bytes=32)
 */
export function generateRandomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Computes a deterministic SHA-256 hash of a plaintext token for secure DB storage.
 *
 * @param {string} token
 * @returns {string} SHA-256 hexadecimal hash
 */
export function hashToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Token to hash must be a non-empty string');
  }
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generates a signed short-lived JWT access token for a user.
 *
 * @param {{ id: string, email: string, role: string }} user
 * @returns {string} Signed JWT
 */
export function generateAccessToken(user) {
  const payload = {
    sub: user.id,
    email: user.email,
    role: user.role
  };

  return jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn
  });
}

/**
 * Verifies a JWT access token and returns its decoded payload.
 *
 * @param {string} token
 * @returns {{ sub: string, email: string, role: string, iat: number, exp: number }}
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, env.jwtAccessSecret);
}

/**
 * Calculates expiration Date for refresh sessions.
 *
 * @returns {Date}
 */
export function getRefreshTokenExpiry() {
  const ms = parseDurationToMs(env.refreshTokenExpiresIn);
  return new Date(Date.now() + ms);
}

/**
 * Calculates expiration Date for single-use email verification tokens.
 *
 * @returns {Date}
 */
export function getEmailVerificationExpiry() {
  const ms = parseDurationToMs(env.emailVerificationExpiresIn);
  return new Date(Date.now() + ms);
}

/**
 * Calculates expiration Date for single-use password reset tokens.
 *
 * @returns {Date}
 */
export function getPasswordResetExpiry() {
  const ms = parseDurationToMs(env.passwordResetExpiresIn);
  return new Date(Date.now() + ms);
}
