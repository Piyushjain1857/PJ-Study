import prisma from '../../config/database.js';
import userRepository, { USER_SAFE_SELECT } from '../users/user.repository.js';
import authRepository from '../auth/auth.repository.js';
import auditService from '../audit/audit.service.js';
import { ROLES, canRoleManageTarget, ROLE_PERMISSIONS } from '../../auth/rolePermissions.js';
import { PERMISSIONS } from '../../auth/permissions.js';
import { getPaginationParams, buildPaginatedResponse } from '../../utils/pagination.js';
import { slugify } from '../courses/course.service.js';

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

  /**
   * Retrieves full overview KPI metrics for the Super Admin Control Center.
   */
  async getOverview() {
    const [
      totalUsers,
      activeUsers,
      studentsCount,
      moderatorsCount,
      adminsCount,
      superAdminsCount,
      totalNotes,
      approvedNotes,
      pendingNotes,
      pendingReviewNotes,
      rejectedNotes,
      draftNotes,
      totalDownloads,
      openNoteReports,
      openReviewReports
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: ROLES.STUDENT } }),
      prisma.user.count({ where: { role: ROLES.MODERATOR } }),
      prisma.user.count({ where: { role: ROLES.ADMIN } }),
      prisma.user.count({ where: { role: ROLES.SUPER_ADMIN } }),
      prisma.note.count(),
      prisma.note.count({ where: { status: 'APPROVED' } }),
      prisma.note.count({ where: { status: 'PENDING' } }),
      prisma.note.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.note.count({ where: { status: 'REJECTED' } }),
      prisma.note.count({ where: { status: 'DRAFT' } }),
      prisma.downloadHistory.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.reviewReport.count({ where: { status: 'OPEN' } })
    ]);

    const activeScholars = await prisma.user.count({
      where: { role: ROLES.STUDENT, isActive: true }
    });
    const activeModerators = await prisma.user.count({
      where: { role: ROLES.MODERATOR, isActive: true }
    });

    const pendingTotal = pendingNotes + pendingReviewNotes;
    const reportedTotal = openNoteReports + openReviewReports;

    return {
      totalUsers,
      activeUsers,
      suspendedUsers: totalUsers - activeUsers,
      activeScholars,
      activeModerators,
      totalNotes,
      approvedNotes,
      pendingModeration: pendingTotal,
      rejectedNotes,
      draftNotes,
      totalDownloads,
      reportedContent: reportedTotal,
      openNoteReports,
      openReviewReports,
      roles: {
        [ROLES.STUDENT]: studentsCount,
        [ROLES.MODERATOR]: moderatorsCount,
        [ROLES.ADMIN]: adminsCount,
        [ROLES.SUPER_ADMIN]: superAdminsCount
      }
    };
  }

  /**
   * Retrieves operational time-series analytics for Super Admin.
   *
   * @param {string} [range='30d']
   */
  async getAnalytics(range = '30d') {
    let days = 30;
    if (range === '7d') days = 7;
    else if (range === '90d') days = 90;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
    startDate.setUTCHours(0, 0, 0, 0);

    const [regRaw, notesRaw, downloadsRaw, topNotes, categories, statusGroup] = await Promise.all([
      prisma.$queryRaw`
        SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, COUNT(*) as count
        FROM users
        WHERE created_at >= ${startDate} AND created_at <= ${endDate}
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
      `,
      prisma.$queryRaw`
        SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, COUNT(*) as count
        FROM notes
        WHERE created_at >= ${startDate} AND created_at <= ${endDate}
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
      `,
      prisma.$queryRaw`
        SELECT DATE_FORMAT(downloaded_at, '%Y-%m-%d') as date, COUNT(*) as count
        FROM download_history
        WHERE downloaded_at >= ${startDate} AND downloaded_at <= ${endDate}
        GROUP BY DATE_FORMAT(downloaded_at, '%Y-%m-%d')
      `,
      prisma.note.findMany({
        where: { status: 'APPROVED' },
        orderBy: [{ downloadCount: 'desc' }, { viewCount: 'desc' }],
        take: 5,
        select: {
          id: true,
          title: true,
          downloadCount: true,
          viewCount: true,
          subject: { select: { name: true } },
          course: { select: { name: true } }
        }
      }),
      prisma.category.findMany({
        select: {
          id: true,
          name: true,
          slug: true,
          _count: { select: { notes: true } }
        },
        orderBy: { notes: { _count: 'desc' } },
        take: 6
      }),
      prisma.note.groupBy({
        by: ['status'],
        _count: { id: true }
      })
    ]);

    const regMap = new Map((regRaw || []).map((r) => [r.date, Number(r.count)]));
    const notesMap = new Map((notesRaw || []).map((r) => [r.date, Number(r.count)]));
    const dlMap = new Map((downloadsRaw || []).map((r) => [r.date, Number(r.count)]));

    const timeline = [];
    const cur = new Date(startDate);
    let totalReg = 0;
    let totalNotes = 0;
    let totalDownloads = 0;

    while (cur <= endDate) {
      const dStr = cur.toISOString().split('T')[0];
      const registrations = regMap.get(dStr) || 0;
      const notes = notesMap.get(dStr) || 0;
      const downloads = dlMap.get(dStr) || 0;

      totalReg += registrations;
      totalNotes += notes;
      totalDownloads += downloads;

      timeline.push({
        date: dStr,
        registrations,
        notes,
        downloads
      });
      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    const moderationWorkload = {};
    for (const s of statusGroup) {
      moderationWorkload[s.status] = s._count.id;
    }

    return {
      range,
      totals: {
        registrations: totalReg,
        notes: totalNotes,
        downloads: totalDownloads
      },
      timeline,
      topNotes,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        count: c._count.notes
      })),
      moderationWorkload
    };
  }

  /**
   * Retrieves list of staff and moderators with activity statistics.
   *
   * @param {object} [query]
   */
  async getModerators(query = {}) {
    const { page, limit, skip } = getPaginationParams(query);

    const where = {
      role: { in: [ROLES.MODERATOR, ROLES.ADMIN, ROLES.SUPER_ADMIN] }
    };

    if (query.role && [ROLES.MODERATOR, ROLES.ADMIN, ROLES.SUPER_ADMIN].includes(query.role)) {
      where.role = query.role;
    }

    if (query.search && query.search.trim().length > 0) {
      const s = query.search.trim();
      where.OR = [{ name: { contains: s } }, { email: { contains: s } }];
    }

    const [moderators, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          role: true,
          isActive: true,
          university: true,
          semester: true,
          createdAt: true,
          course: { select: { name: true } },
          _count: {
            select: {
              notes: true,
              reportsReviewed: true,
              reviewReportsReviewed: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    const formatted = moderators.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      avatarUrl: m.avatarUrl,
      role: m.role,
      isActive: m.isActive,
      university: m.university,
      semester: m.semester,
      course: m.course?.name || null,
      notesUploaded: m._count.notes,
      decisionsCount: m._count.reportsReviewed + m._count.reviewReportsReviewed,
      createdAt: m.createdAt
    }));

    return buildPaginatedResponse(formatted, total, page, limit);
  }

  /**
   * Retrieves notes across all moderation statuses for administrative oversight.
   *
   * @param {object} [query]
   */
  async getNotes(query = {}) {
    const { page, limit, skip } = getPaginationParams(query);

    const where = {};

    if (query.search && query.search.trim().length > 0) {
      const s = query.search.trim();
      where.OR = [{ title: { contains: s } }, { description: { contains: s } }];
    }

    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query.courseId) where.courseId = query.courseId;
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.semester) where.semester = Number(query.semester);
    if (query.categoryId) where.categoryId = query.categoryId;

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          course: { select: { id: true, name: true, slug: true } },
          subject: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
          uploadedBy: { select: { id: true, name: true, email: true, role: true } },
          _count: { select: { reports: true, reviews: true } }
        }
      }),
      prisma.note.count({ where })
    ]);

    const formatted = notes.map((n) => ({
      ...n,
      fileSize: typeof n.fileSize === 'bigint' ? n.fileSize.toString() : n.fileSize,
      reportsCount: n._count?.reports || 0,
      reviewsCount: n._count?.reviews || 0
    }));

    return buildPaginatedResponse(formatted, total, page, limit);
  }

  /**
   * Deletes a note permanently with administrative auditing.
   *
   * @param {string} noteId
   * @param {{ id: string, role: string }} actor
   * @param {string} [reason]
   */
  async deleteNote(noteId, actor, reason = 'Administrative removal') {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
      select: { id: true, title: true, uploadedById: true }
    });

    if (!note) {
      const error = new Error('Note not found.');
      error.statusCode = 404;
      throw error;
    }

    await prisma.note.delete({ where: { id: noteId } });

    await auditService.log({
      actorId: actor.id,
      action: 'NOTE_DELETED_BY_ADMIN',
      entityType: 'NOTE',
      entityId: noteId,
      metadata: {
        noteTitle: note.title,
        uploadedById: note.uploadedById,
        reason
      }
    });

    return { id: noteId, deleted: true, title: note.title };
  }

  /**
   * Retrieves all academic taxonomy records (courses, subjects, categories).
   */
  async getAcademics() {
    const [courses, subjects, categories] = await Promise.all([
      prisma.course.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { subjects: true, notes: true, users: true } }
        }
      }),
      prisma.subject.findMany({
        orderBy: [{ course: { name: 'asc' } }, { semester: 'asc' }, { name: 'asc' }],
        include: {
          course: { select: { id: true, name: true } },
          _count: { select: { notes: true } }
        }
      }),
      prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { notes: true } }
        }
      })
    ]);

    return {
      courses: courses.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        description: c.description,
        isActive: c.isActive,
        subjectCount: c._count.subjects,
        noteCount: c._count.notes,
        userCount: c._count.users,
        createdAt: c.createdAt
      })),
      subjects: subjects.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description,
        semester: s.semester,
        courseId: s.courseId,
        courseName: s.course.name,
        isActive: s.isActive,
        noteCount: s._count.notes,
        createdAt: s.createdAt
      })),
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        isActive: cat.isActive,
        noteCount: cat._count.notes,
        createdAt: cat.createdAt
      }))
    };
  }

  async createCourse(data, actor) {
    if (!data.name || data.name.trim().length < 2) {
      const err = new Error('Course name must be at least 2 characters long.');
      err.statusCode = 422;
      throw err;
    }
    const slug = slugify(data.slug || data.name);
    const existing = await prisma.course.findUnique({ where: { slug } });
    if (existing) {
      const err = new Error(`A course with slug "${slug}" already exists.`);
      err.statusCode = 409;
      throw err;
    }
    const course = await prisma.course.create({
      data: {
        name: data.name.trim(),
        slug,
        description: data.description?.trim() || null,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
      }
    });
    await auditService.log({
      actorId: actor.id,
      action: 'COURSE_CREATED',
      entityType: 'COURSE',
      entityId: course.id,
      metadata: { name: course.name, slug: course.slug }
    });
    return course;
  }

  async updateCourse(id, data, actor) {
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      const err = new Error('Course not found.');
      err.statusCode = 404;
      throw err;
    }
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);
    if (data.slug) updateData.slug = slugify(data.slug);

    const updated = await prisma.course.update({
      where: { id },
      data: updateData
    });
    await auditService.log({
      actorId: actor.id,
      action: 'COURSE_UPDATED',
      entityType: 'COURSE',
      entityId: id,
      metadata: updateData
    });
    return updated;
  }

  async createSubject(data, actor) {
    if (!data.courseId) {
      const err = new Error('Course ID is required to create a subject.');
      err.statusCode = 422;
      throw err;
    }
    if (!data.name || data.name.trim().length < 2) {
      const err = new Error('Subject name must be at least 2 characters.');
      err.statusCode = 422;
      throw err;
    }
    const semester = Number(data.semester);
    if (!semester || semester < 1 || semester > 12) {
      const err = new Error('Semester must be an integer between 1 and 12.');
      err.statusCode = 422;
      throw err;
    }
    const slug = slugify(data.slug || data.name);
    const subject = await prisma.subject.create({
      data: {
        courseId: data.courseId,
        semester,
        name: data.name.trim(),
        slug,
        description: data.description?.trim() || null,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
      }
    });
    await auditService.log({
      actorId: actor.id,
      action: 'SUBJECT_CREATED',
      entityType: 'SUBJECT',
      entityId: subject.id,
      metadata: { name: subject.name, courseId: data.courseId, semester }
    });
    return subject;
  }

  async updateSubject(id, data, actor) {
    const subject = await prisma.subject.findUnique({ where: { id } });
    if (!subject) {
      const err = new Error('Subject not found.');
      err.statusCode = 404;
      throw err;
    }
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.semester !== undefined) updateData.semester = Number(data.semester);
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);
    if (data.slug) updateData.slug = slugify(data.slug);

    const updated = await prisma.subject.update({
      where: { id },
      data: updateData
    });
    await auditService.log({
      actorId: actor.id,
      action: 'SUBJECT_UPDATED',
      entityType: 'SUBJECT',
      entityId: id,
      metadata: updateData
    });
    return updated;
  }

  async createCategory(data, actor) {
    if (!data.name || data.name.trim().length < 2) {
      const err = new Error('Category name must be at least 2 characters.');
      err.statusCode = 422;
      throw err;
    }
    const slug = slugify(data.slug || data.name);
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      const err = new Error(`Category with slug "${slug}" already exists.`);
      err.statusCode = 409;
      throw err;
    }
    const category = await prisma.category.create({
      data: {
        name: data.name.trim(),
        slug,
        description: data.description?.trim() || null,
        isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
      }
    });
    await auditService.log({
      actorId: actor.id,
      action: 'CATEGORY_CREATED',
      entityType: 'CATEGORY',
      entityId: category.id,
      metadata: { name: category.name }
    });
    return category;
  }

  async updateCategory(id, data, actor) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      const err = new Error('Category not found.');
      err.statusCode = 404;
      throw err;
    }
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);
    if (data.slug) updateData.slug = slugify(data.slug);

    const updated = await prisma.category.update({
      where: { id },
      data: updateData
    });
    await auditService.log({
      actorId: actor.id,
      action: 'CATEGORY_UPDATED',
      entityType: 'CATEGORY',
      entityId: id,
      metadata: updateData
    });
    return updated;
  }

  /**
   * Retrieves content reports across notes and reviews.
   */
  async getReports(query = {}) {
    const { page, limit, skip } = getPaginationParams(query);
    const type = query.type || 'ALL';
    const status = query.status || 'ALL';

    const noteReportsWhere = {};
    if (status !== 'ALL') {
      if (status === 'OPEN' || status === 'PENDING') noteReportsWhere.status = 'PENDING';
      else if (status === 'RESOLVED') noteReportsWhere.status = 'RESOLVED';
      else if (status === 'DISMISSED') noteReportsWhere.status = 'DISMISSED';
    }

    const reviewReportsWhere = {};
    if (status !== 'ALL') {
      if (status === 'OPEN' || status === 'PENDING') reviewReportsWhere.status = 'OPEN';
      else if (status === 'RESOLVED' || status === 'ACTIONED') reviewReportsWhere.status = 'ACTIONED';
      else if (status === 'DISMISSED') reviewReportsWhere.status = 'DISMISSED';
    }

    const [noteReports, reviewReports] = await Promise.all([
      type === 'REVIEWS'
        ? [[], 0]
        : Promise.all([
            prisma.report.findMany({
              where: noteReportsWhere,
              orderBy: { createdAt: 'desc' },
              take: limit,
              skip,
              include: {
                reportedBy: { select: { id: true, name: true, email: true } },
                reviewedBy: { select: { id: true, name: true } },
                note: {
                  select: {
                    id: true,
                    title: true,
                    slug: true,
                    status: true,
                    uploadedBy: { select: { id: true, name: true } }
                  }
                }
              }
            }),
            prisma.report.count({ where: noteReportsWhere })
          ]),
      type === 'NOTES'
        ? [[], 0]
        : Promise.all([
            prisma.reviewReport.findMany({
              where: reviewReportsWhere,
              orderBy: { createdAt: 'desc' },
              take: limit,
              skip,
              include: {
                reporter: { select: { id: true, name: true, email: true } },
                reviewedBy: { select: { id: true, name: true } },
                review: {
                  select: {
                    id: true,
                    rating: true,
                    comment: true,
                    status: true,
                    note: { select: { id: true, title: true } }
                  }
                }
              }
            }),
            prisma.reviewReport.count({ where: reviewReportsWhere })
          ])
    ]);

    const formattedNoteReports = (noteReports[0] || []).map((r) => ({
      id: r.id,
      targetType: 'NOTE',
      reason: r.reason,
      description: r.description,
      status: r.status,
      createdAt: r.createdAt,
      reportedBy: r.reportedBy,
      reviewedBy: r.reviewedBy,
      target: {
        id: r.note?.id,
        title: r.note?.title,
        status: r.note?.status,
        author: r.note?.uploadedBy?.name
      }
    }));

    const formattedReviewReports = (reviewReports[0] || []).map((r) => ({
      id: r.id,
      targetType: 'REVIEW',
      reason: r.reason,
      description: r.description,
      status: r.status === 'OPEN' ? 'PENDING' : r.status === 'ACTIONED' ? 'RESOLVED' : 'DISMISSED',
      createdAt: r.createdAt,
      reportedBy: r.reporter,
      reviewedBy: r.reviewedBy,
      target: {
        id: r.review?.id,
        title: `Review on: ${r.review?.note?.title || 'Note'} (${r.review?.rating}★)`,
        comment: r.review?.comment,
        status: r.review?.status
      }
    }));

    const combined = [...formattedNoteReports, ...formattedReviewReports].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return {
      items: combined.slice(0, limit),
      pagination: {
        page,
        limit,
        total: (noteReports[1] || 0) + (reviewReports[1] || 0)
      }
    };
  }

  async resolveReport(reportId, action, actor, reason = '') {
    const noteReport = await prisma.report.findUnique({ where: { id: reportId } });
    if (noteReport) {
      const newStatus = action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED';
      const updated = await prisma.report.update({
        where: { id: reportId },
        data: {
          status: newStatus,
          reviewedById: actor.id,
          reviewedAt: new Date()
        }
      });
      await auditService.log({
        actorId: actor.id,
        action: `NOTE_REPORT_${newStatus}`,
        entityType: 'NOTE_REPORT',
        entityId: reportId,
        metadata: { action, reason, noteId: noteReport.noteId }
      });
      return updated;
    }

    const reviewReport = await prisma.reviewReport.findUnique({ where: { id: reportId } });
    if (reviewReport) {
      const newStatus = action === 'DISMISS' ? 'DISMISSED' : 'ACTIONED';
      const updated = await prisma.reviewReport.update({
        where: { id: reportId },
        data: {
          status: newStatus,
          reviewedById: actor.id,
          reviewedAt: new Date()
        }
      });
      await auditService.log({
        actorId: actor.id,
        action: `REVIEW_REPORT_${newStatus}`,
        entityType: 'REVIEW_REPORT',
        entityId: reportId,
        metadata: { action, reason, reviewId: reviewReport.reviewId }
      });
      return updated;
    }

    const err = new Error('Report record not found.');
    err.statusCode = 404;
    throw err;
  }

  /**
   * Retrieves runtime configurable platform settings.
   */
  async getSettings() {
    let settings = await prisma.platformSetting.findMany();

    if (settings.length === 0) {
      const defaults = [
        {
          key: 'platformName',
          value: 'PJ Study',
          category: 'BRANDING',
          description: 'Official academic platform name'
        },
        {
          key: 'tagline',
          value: 'Your Entire Study World, One Place.',
          category: 'BRANDING',
          description: 'Platform tagline displayed on landing headers'
        },
        {
          key: 'maxUploadSizeMb',
          value: '25',
          category: 'STORAGE',
          description: 'Maximum allowable file upload size in megabytes'
        },
        {
          key: 'allowedFileFormats',
          value: 'application/pdf,image/jpeg,image/png',
          category: 'STORAGE',
          description: 'Comma-separated list of permitted MIME types'
        },
        {
          key: 'autoModerationEnabled',
          value: 'false',
          category: 'MODERATION',
          description: 'Whether uploaded notes bypass review queue (restricted)'
        },
        {
          key: 'allowStudentReviews',
          value: 'true',
          category: 'COMMUNITY',
          description: 'Permit student reviews and star ratings on approved notes'
        }
      ];

      for (const d of defaults) {
        await prisma.platformSetting.upsert({
          where: { key: d.key },
          update: {},
          create: d
        });
      }

      settings = await prisma.platformSetting.findMany();
    }

    const settingsMap = {};
    for (const s of settings) {
      settingsMap[s.key] = {
        value: s.value,
        category: s.category,
        description: s.description,
        updatedAt: s.updatedAt
      };
    }

    return settingsMap;
  }

  /**
   * Updates platform configuration parameters (Super Admin exclusive).
   *
   * @param {object} settingsMap
   * @param {{ id: string, role: string }} actor
   */
  async updateSettings(settingsMap, actor) {
    if (!settingsMap || typeof settingsMap !== 'object') {
      const err = new Error('Settings object is required.');
      err.statusCode = 422;
      throw err;
    }

    const allowedKeys = [
      'platformName',
      'tagline',
      'maxUploadSizeMb',
      'allowedFileFormats',
      'autoModerationEnabled',
      'allowStudentReviews'
    ];

    const updated = {};

    for (const [key, value] of Object.entries(settingsMap)) {
      if (!allowedKeys.includes(key)) continue;

      const sanitizedValue = String(value).trim();

      if (key === 'platformName' && sanitizedValue.length < 2) {
        const err = new Error('Platform name must be at least 2 characters long.');
        err.statusCode = 422;
        throw err;
      }

      if (key === 'maxUploadSizeMb') {
        const num = Number(sanitizedValue);
        if (isNaN(num) || num < 1 || num > 200) {
          const err = new Error('Max upload size must be between 1 MB and 200 MB.');
          err.statusCode = 422;
          throw err;
        }
      }

      await prisma.platformSetting.upsert({
        where: { key },
        update: {
          value: sanitizedValue,
          updatedById: actor.id
        },
        create: {
          key,
          value: sanitizedValue,
          category: 'GENERAL',
          updatedById: actor.id
        }
      });

      updated[key] = sanitizedValue;
    }

    await auditService.log({
      actorId: actor.id,
      action: 'PLATFORM_SETTINGS_UPDATED',
      entityType: 'PLATFORM_SETTINGS',
      entityId: 'SYSTEM',
      metadata: updated
    });

    return updated;
  }
}

export const adminService = new AdminService();
export default adminService;
