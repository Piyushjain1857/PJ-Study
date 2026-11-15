import prisma from '../../config/database.js';

export class AdminWorkspaceService {
  /**
   * Scoped dashboard overview for an Admin.
   * Calculates metrics strictly scoped to the admin's contributions and moderation workload.
   */
  async getOverview(adminId) {
    const [
      myUploadedNotes,
      approvedNotes,
      rejectedNotes,
      draftNotes,
      pendingReviews,
      totalDownloadsAgg,
      recentNotes,
      recentDecisions,
      openReportsCount
    ] = await Promise.all([
      prisma.note.count({ where: { uploadedById: adminId } }),
      prisma.note.count({ where: { uploadedById: adminId, status: 'APPROVED' } }),
      prisma.note.count({ where: { uploadedById: adminId, status: 'REJECTED' } }),
      prisma.note.count({ where: { uploadedById: adminId, status: 'DRAFT' } }),
      prisma.note.count({ where: { status: { in: ['PENDING', 'PENDING_REVIEW'] } } }),
      prisma.downloadHistory.count({
        where: {
          note: { uploadedById: adminId }
        }
      }),
      prisma.note.findMany({
        where: { uploadedById: adminId },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
          course: { select: { name: true } },
          subject: { select: { name: true } },
          _count: { select: { downloadHistory: true } }
        }
      }),
      prisma.auditLog.findMany({
        where: {
          actorId: adminId,
          action: { in: ['note:approve', 'note:reject', 'note:create', 'note:update'] }
        },
        take: 8,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.report.count({ where: { status: 'PENDING' } })
    ]);

    return {
      myUploadedNotes,
      approvedNotes,
      rejectedNotes,
      draftNotes,
      assignedNotes: pendingReviews,
      pendingReviews,
      totalDownloads: totalDownloadsAgg,
      openReportsCount,
      recentUploads: recentNotes.map((n) => ({
        id: n.id,
        title: n.title,
        status: n.status,
        courseName: n.course?.name || 'General',
        subjectName: n.subject?.name || 'Curriculum',
        downloads: n._count?.downloadHistory || 0,
        updatedAt: n.updatedAt
      })),
      recentActivity: recentDecisions.map((d) => ({
        id: d.id,
        action: d.action,
        entityType: d.entityType,
        entityId: d.entityId,
        metadata: d.metadata,
        createdAt: d.createdAt
      }))
    };
  }

  /**
   * Scoped analytics for Admin.
   */
  async getAnalytics(adminId) {
    const [statusGroups, recentAudits, totalUploaded, totalApproved] = await Promise.all([
      prisma.note.groupBy({
        by: ['status'],
        where: { uploadedById: adminId },
        _count: { id: true }
      }),
      prisma.auditLog.findMany({
        where: { actorId: adminId },
        take: 20,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.note.count({ where: { uploadedById: adminId } }),
      prisma.note.count({ where: { uploadedById: adminId, status: 'APPROVED' } })
    ]);

    const statusCounts = {
      APPROVED: 0,
      PENDING: 0,
      PENDING_REVIEW: 0,
      REJECTED: 0,
      DRAFT: 0
    };
    for (const g of statusGroups) {
      statusCounts[g.status] = g._count.id;
    }

    const approvalRate = totalUploaded > 0 ? Math.round((totalApproved / totalUploaded) * 100) : 100;

    return {
      approvalRate,
      statusBreakdown: statusCounts,
      recentContentActions: recentAudits
    };
  }

  /**
   * Moderation Queue for review.
   */
  async getQueue(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const where = {
      status: { in: ['PENDING', 'PENDING_REVIEW'] }
    };

    if (query.courseId) where.courseId = query.courseId;
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { title: { contains: s } },
        { content: { contains: s } }
      ];
    }

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          uploadedBy: { select: { id: true, name: true, email: true, role: true } },
          course: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true, semester: true } },
          category: { select: { id: true, name: true } }
        }
      }),
      prisma.note.count({ where })
    ]);

    return {
      notes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Assigned content reports for Admin.
   */
  async getReports(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const where = { status: 'PENDING' };

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reportedBy: { select: { id: true, name: true, email: true } },
          note: { select: { id: true, title: true, status: true } }
        }
      }),
      prisma.report.count({ where })
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Moderation history for this Admin.
   */
  async getHistory(adminId, query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          actorId: adminId,
          action: { in: ['note:approve', 'note:reject'] }
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.auditLog.count({
        where: {
          actorId: adminId,
          action: { in: ['note:approve', 'note:reject'] }
        }
      })
    ]);

    return {
      history: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

export const adminWorkspaceService = new AdminWorkspaceService();
export default adminWorkspaceService;
