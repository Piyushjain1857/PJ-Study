import prisma from '../../config/database.js';
import userRepository, { USER_SAFE_SELECT } from '../users/user.repository.js';
import authRepository from '../auth/auth.repository.js';
import auditService from '../audit/audit.service.js';
import { ROLES, canRoleManageTarget, ROLE_PERMISSIONS } from '../../auth/rolePermissions.js';
import { PERMISSIONS } from '../../auth/permissions.js';
import { getPaginationParams, buildPaginatedResponse } from '../../utils/pagination.js';

/**
 * Service managing administrative operations, role assignments, user status, and audit governance.
 */
export class AdminService {
  /**
   * Retrieves a paginated, searchable, and filtered list of users.
   *
   * @param {{
   *   page?: number|string,
   *   limit?: number|string,
   *   search?: string,
   *   role?: string,
   *   status?: string,
   *   sortBy?: string,
   *   sortOrder?: string
   * }} query
   * @returns {Promise<any>}
   */
  async getUsers(query = {}) {
    const { page, limit, skip } = getPaginationParams(query);

    const where = {};

    // Search by name or email
    if (query.search && typeof query.search === 'string') {
      const search = query.search.trim();
      if (search.length > 0) {
        where.OR = [{ name: { contains: search } }, { email: { contains: search } }];
      }
    }

    // Filter by role
    if (query.role && Object.values(ROLES).includes(query.role.toUpperCase())) {
      where.role = query.role.toUpperCase();
    }

    // Filter by account active status
    if (query.status) {
      if (query.status === 'active') {
        where.isActive = true;
      } else if (query.status === 'suspended') {
        where.isActive = false;
      }
    }

    const orderBy = {};
    const validSortFields = ['createdAt', 'name', 'email', 'role'];
    const sortField = validSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';
    orderBy[sortField] = sortOrder;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: USER_SAFE_SELECT
      }),
      prisma.user.count({ where })
    ]);

    return buildPaginatedResponse(users, total, page, limit);
  }

  /**
   * Retrieves detailed profile for an individual user along with academic statistics.
   *
   * @param {string} id
   * @returns {Promise<any>}
   */
  async getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      const error = new Error(`User with ID "${id}" was not found.`);
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    // Fetch account activity statistics
    const [notesCount, bookmarksCount, reviewsCount] = await Promise.all([
      prisma.note.count({ where: { uploadedById: id } }),
      prisma.bookmark.count({ where: { userId: id } }),
      prisma.review.count({ where: { userId: id } })
    ]);

    return {
      ...user,
      stats: {
        notesCount,
        bookmarksCount,
        reviewsCount
      }
    };
  }

  /**
   * Updates basic user profile information or modifies account suspension status.
   *
   * @param {string} targetId - ID of user to update
   * @param {{
   *   name?: string,
   *   bio?: string,
   *   isActive?: boolean,
   *   reason?: string
   * }} data
   * @param {{ id: string, role: string }} actor - Authenticated administrator
   * @returns {Promise<any>}
   */
  async updateUser(targetId, data, actor) {
    const targetUser = await userRepository.findById(targetId);
    if (!targetUser) {
      const error = new Error(`User with ID "${targetId}" was not found.`);
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const updatePayload = {};

    if (typeof data.name === 'string' && data.name.trim().length >= 2) {
      updatePayload.name = data.name.trim();
    }

    if (data.bio !== undefined) {
      updatePayload.bio = typeof data.bio === 'string' ? data.bio.trim() : null;
    }

    // Status suspension / reactivation logic
    if (typeof data.isActive === 'boolean') {
      if (data.isActive === false) {
        // Rule: Caller cannot suspend their own account
        if (targetId === actor.id) {
          const error = new Error('You cannot suspend your own administrative account.');
          error.statusCode = 400;
          error.code = 'CANNOT_SUSPEND_SELF';
          throw error;
        }

        // Rule: Admin cannot suspend an Admin or Super Admin
        if (
          actor.role === ROLES.ADMIN &&
          (targetUser.role === ROLES.ADMIN || targetUser.role === ROLES.SUPER_ADMIN)
        ) {
          const error = new Error(
            'Administrators cannot suspend another Administrator or Super Administrator.'
          );
          error.statusCode = 403;
          error.code = 'FORBIDDEN';
          throw error;
        }

        // Rule: Protect last active Super Admin
        if (targetUser.role === ROLES.SUPER_ADMIN) {
          const activeSuperAdminCount = await prisma.user.count({
            where: {
              role: ROLES.SUPER_ADMIN,
              isActive: true
            }
          });

          if (activeSuperAdminCount <= 1) {
            const error = new Error('Cannot suspend the last active Super Administrator.');
            error.statusCode = 400;
            error.code = 'LAST_SUPER_ADMIN_PROTECTED';
            throw error;
          }
        }
      }

      updatePayload.isActive = data.isActive;
    }

    // Atomic update, session eviction, and audit log
    return prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: targetId },
        data: updatePayload,
        select: USER_SAFE_SELECT
      });

      // If user was suspended, revoke all active sessions immediately
      if (data.isActive === false) {
        await tx.refreshSession.updateMany({
          where: { userId: targetId, revokedAt: null },
          data: { revokedAt: new Date() }
        });
      }

      // Record audit log for status adjustments
      if (typeof data.isActive === 'boolean' && data.isActive !== targetUser.isActive) {
        await tx.auditLog.create({
          data: {
            actorId: actor.id,
            action: data.isActive ? 'USER_REACTIVATED' : 'USER_SUSPENDED',
            entityType: 'User',
            entityId: targetId,
            metadata: {
              previousStatus: targetUser.isActive,
              newStatus: data.isActive,
              reason: data.reason || 'Administrative status update'
            }
          }
        });
      } else if (updatePayload.name || updatePayload.bio !== undefined) {
        await tx.auditLog.create({
          data: {
            actorId: actor.id,
            action: 'USER_PROFILE_UPDATED',
            entityType: 'User',
            entityId: targetId,
            metadata: {
              changes: updatePayload
            }
          }
        });
      }

      return updatedUser;
    });
  }

  /**
   * Modifies a user's role with strict hierarchy enforcement,
   * last active Super Admin protection, transaction safety, and session eviction.
   *
   * @param {string} targetId - ID of user whose role is being changed
   * @param {string} requestedRole - New role to assign
   * @param {string} [reason] - Administrative rationale
   * @param {{ id: string, role: string }} actor - Requesting administrator
   * @returns {Promise<any>}
   */
  async changeUserRole(targetId, requestedRole, reason, actor) {
    const targetUser = await userRepository.findById(targetId);
    if (!targetUser) {
      const error = new Error(`User with ID "${targetId}" was not found.`);
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    // Invariant 1: No user can modify their own role
    if (targetId === actor.id) {
      const error = new Error('Users are not permitted to modify their own role.');
      error.statusCode = 400;
      error.code = 'CANNOT_MODIFY_OWN_ROLE';
      throw error;
    }

    // Invariant 2: Validate role value against approved enum list
    const normalizedRole = requestedRole ? requestedRole.toUpperCase().trim() : '';
    if (!Object.values(ROLES).includes(normalizedRole)) {
      const error = new Error(
        `Invalid role "${requestedRole}". Approved roles: ${Object.values(ROLES).join(', ')}.`
      );
      error.statusCode = 400;
      error.code = 'INVALID_ROLE';
      throw error;
    }

    // If role is unchanged, return gracefully
    if (targetUser.role === normalizedRole) {
      return targetUser;
    }

    // Invariant 3: Verify caller authority against target and requested role
    const authorityCheck = canRoleManageTarget(actor.role, targetUser.role, normalizedRole);
    if (!authorityCheck.allowed) {
      const error = new Error(
        authorityCheck.reason || 'Insufficient permissions to change this role.'
      );
      error.statusCode = 403;
      error.code = 'FORBIDDEN_ROLE_MANAGEMENT';
      throw error;
    }

    // Invariant 4: Protect accidental demotion or removal of the last active Super Admin
    if (targetUser.role === ROLES.SUPER_ADMIN && normalizedRole !== ROLES.SUPER_ADMIN) {
      const activeSuperAdminCount = await prisma.user.count({
        where: {
          role: ROLES.SUPER_ADMIN,
          isActive: true
        }
      });

      if (activeSuperAdminCount <= 1) {
        const error = new Error(
          'Cannot demote or remove the last active Super Administrator. Assign another Super Admin first.'
        );
        error.statusCode = 400;
        error.code = 'LAST_SUPER_ADMIN_PROTECTED';
        throw error;
      }
    }

    // Execute atomic role change, session eviction, and audit log
    return prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: targetId },
        data: { role: normalizedRole },
        select: USER_SAFE_SELECT
      });

      // Revoke all existing sessions for target user so their next request receives their new role
      await tx.refreshSession.updateMany({
        where: { userId: targetId, revokedAt: null },
        data: { revokedAt: new Date() }
      });

      // Append immutable audit log entry
      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: 'USER_ROLE_CHANGED',
          entityType: 'User',
          entityId: targetId,
          metadata: {
            previousRole: targetUser.role,
            newRole: normalizedRole,
            reason: reason || 'Administrative role adjustment'
          }
        }
      });

      return updatedUser;
    });
  }

  /**
   * Returns list of roles and the complete capability matrix.
   */
  async getRolesAndPermissions() {
    const rolesList = [
      {
        id: ROLES.STUDENT,
        name: 'Student',
        description:
          'Standard academic scholar who can browse, read, create, and manage their personal study notes.',
        permissions: ROLE_PERMISSIONS[ROLES.STUDENT]
      },
      {
        id: ROLES.MODERATOR,
        name: 'Moderator',
        description:
          'Academic reviewer with authority to evaluate, approve, or reject student note submissions.',
        permissions: ROLE_PERMISSIONS[ROLES.MODERATOR]
      },
      {
        id: ROLES.ADMIN,
        name: 'Administrator',
        description:
          'Manages curriculum taxonomy, user accounts, and student/moderator role assignments.',
        permissions: ROLE_PERMISSIONS[ROLES.ADMIN]
      },
      {
        id: ROLES.SUPER_ADMIN,
        name: 'Super Administrator',
        description:
          'Platform owner with full system governance, administrator management, and settings configuration.',
        permissions: ROLE_PERMISSIONS[ROLES.SUPER_ADMIN]
      }
    ];

    const permissionsList = Object.entries(PERMISSIONS).map(([key, value]) => ({
      key,
      id: value
    }));

    return {
      roles: rolesList,
      permissions: permissionsList
    };
  }

  /**
   * Retrieves high-level user metrics for administrative overview.
   */
  async getStats() {
    const [totalUsers, activeUsers, studentsCount, moderatorsCount, adminsCount, superAdminsCount] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({ where: { role: ROLES.STUDENT } }),
        prisma.user.count({ where: { role: ROLES.MODERATOR } }),
        prisma.user.count({ where: { role: ROLES.ADMIN } }),
        prisma.user.count({ where: { role: ROLES.SUPER_ADMIN } })
      ]);

    return {
      totalUsers,
      activeUsers,
      suspendedUsers: totalUsers - activeUsers,
      roles: {
        [ROLES.STUDENT]: studentsCount,
        [ROLES.MODERATOR]: moderatorsCount,
        [ROLES.ADMIN]: adminsCount,
        [ROLES.SUPER_ADMIN]: superAdminsCount
      }
    };
  }
}

export const adminService = new AdminService();
export default adminService;
