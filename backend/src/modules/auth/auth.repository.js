import prisma from '../../config/database.js';
import { USER_SAFE_SELECT } from '../users/user.repository.js';

/**
 * Repository managing database interactions for authentication, sessions, and security tokens.
 */
export class AuthRepository {
  /**
   * Creates an active refresh session.
   *
   * @param {{ userId: string, tokenHash: string, expiresAt: Date }} data
   * @returns {Promise<any>}
   */
  async createSession({ userId, tokenHash, expiresAt }) {
    return prisma.refreshSession.create({
      data: {
        userId,
        tokenHash,
        expiresAt
      }
    });
  }

  /**
   * Finds a refresh session by its hashed token.
   *
   * @param {string} tokenHash
   * @returns {Promise<any>}
   */
  async findSessionByTokenHash(tokenHash) {
    return prisma.refreshSession.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            ...USER_SAFE_SELECT,
            isActive: true
          }
        }
      }
    });
  }

  /**
   * Marks a specific session as revoked.
   *
   * @param {string} id
   * @returns {Promise<any>}
   */
  async revokeSession(id) {
    return prisma.refreshSession.update({
      where: { id },
      data: { revokedAt: new Date() }
    });
  }

  /**
   * Revokes all active refresh sessions for a specific user (e.g. on reuse detection or password reset).
   *
   * @param {string} userId
   * @returns {Promise<{ count: number }>}
   */
  async revokeAllUserSessions(userId) {
    return prisma.refreshSession.updateMany({
      where: {
        userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
  }

  /**
   * Atomically rotates an old refresh session into a new one within a transaction.
   *
   * @param {{ oldSessionId: string, userId: string, newTokenHash: string, expiresAt: Date }} params
   * @returns {Promise<any>}
   */
  async rotateSession({ oldSessionId, userId, newTokenHash, expiresAt }) {
    return prisma.$transaction(async (tx) => {
      // Mark old session revoked
      await tx.refreshSession.update({
        where: { id: oldSessionId },
        data: { revokedAt: new Date() }
      });

      // Create new session
      const newSession = await tx.refreshSession.create({
        data: {
          userId,
          tokenHash: newTokenHash,
          expiresAt
        }
      });

      return newSession;
    });
  }

  /**
   * Creates an email verification token record.
   *
   * @param {{ userId: string, tokenHash: string, expiresAt: Date }} data
   * @returns {Promise<any>}
   */
  async createEmailVerificationToken({ userId, tokenHash, expiresAt }) {
    return prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt
      }
    });
  }

  /**
   * Finds an email verification token by its hash.
   *
   * @param {string} tokenHash
   * @returns {Promise<any>}
   */
  async findEmailVerificationToken(tokenHash) {
    return prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: USER_SAFE_SELECT
        }
      }
    });
  }

  /**
   * Verifies a user's email and marks the token used in a single atomic transaction.
   *
   * @param {{ userId: string, tokenId: string }} params
   * @returns {Promise<any>}
   */
  async verifyUserEmailAndConsumeToken({ userId, tokenId }) {
    return prisma.$transaction(async (tx) => {
      await tx.emailVerificationToken.update({
        where: { id: tokenId },
        data: { usedAt: new Date() }
      });

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { isEmailVerified: true },
        select: USER_SAFE_SELECT
      });

      return updatedUser;
    });
  }

  /**
   * Creates a password reset token record.
   *
   * @param {{ userId: string, tokenHash: string, expiresAt: Date }} data
   * @returns {Promise<any>}
   */
  async createPasswordResetToken({ userId, tokenHash, expiresAt }) {
    return prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt
      }
    });
  }

  /**
   * Finds a password reset token by its hash.
   *
   * @param {string} tokenHash
   * @returns {Promise<any>}
   */
  async findPasswordResetToken(tokenHash) {
    return prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: USER_SAFE_SELECT
        }
      }
    });
  }

  /**
   * Resets the user's password, invalidates the token, and revokes all active sessions atomically.
   *
   * @param {{ userId: string, tokenId: string, newPasswordHash: string }} params
   * @returns {Promise<any>}
   */
  async resetUserPasswordAndConsumeToken({ userId, tokenId, newPasswordHash }) {
    return prisma.$transaction(async (tx) => {
      // Mark token used
      await tx.passwordResetToken.update({
        where: { id: tokenId },
        data: { usedAt: new Date() }
      });

      // Update password hash
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash },
        select: USER_SAFE_SELECT
      });

      // Revoke all active sessions so compromised devices are evicted
      await tx.refreshSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() }
      });

      return updatedUser;
    });
  }
}

export const authRepository = new AuthRepository();
export default authRepository;
