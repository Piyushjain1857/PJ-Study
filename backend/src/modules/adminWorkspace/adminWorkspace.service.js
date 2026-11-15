import prisma from '../../config/database.js';

export class AdminWorkspaceService {
  /**
   * Scoped dashboard overview for an Admin.
   * Calculates metrics strictly scoped to the admin's contributions and published materials.
   */
  async getOverview(adminId) {
    const [
      myUploadedNotes,
      publishedNotes,
      unpublishedNotes,
      totalDownloadsAgg,
      recentNotes,
      recentActivity,
      openReportsCount
    ] = await Promise.all([
      prisma.note.count({ where: { uploadedById: adminId } }),
      prisma.note.count({ where: { uploadedById: adminId, status: { in: ['PUBLISHED', 'APPROVED'] } } }),
      prisma.note.count({
        where: {
          uploadedById: adminId,
          status: { in: ['UNPUBLISHED', 'DRAFT', 'PENDING', 'PENDING_REVIEW', 'REJECTED', 'ARCHIVED'] }
        }
      }),
      prisma.downloadHistory.count({
        where: {
          note: { uploadedById: adminId }
        }
      }),
      prisma.note.findMany({
        where: { uploadedById: adminId },
        take: 8,
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
          action: { in: ['note:create', 'note:update', 'NOTE_PUBLISHED', 'NOTE_UNPUBLISHED'] }
        },
        take: 8,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.report.count({ where: { status: 'PENDING' } })
    ]);

    return {
      myUploadedNotes,
      publishedNotes,
      unpublishedNotes,
      approvedNotes: publishedNotes,
      draftNotes: unpublishedNotes,
      rejectedNotes: 0,
      assignedNotes: 0,
      pendingReviews: 0,
      totalDownloads: totalDownloadsAgg,
      openReportsCount,
      recentUploads: recentNotes.map((n) => ({
        id: n.id,
        title: n.title,
        status: ['PUBLISHED', 'APPROVED'].includes(n.status) ? 'PUBLISHED' : 'UNPUBLISHED',
        courseName: n.course?.name || 'General',
        subjectName: n.subject?.name || 'Curriculum',
        downloads: n._count?.downloadHistory || 0,
        updatedAt: n.updatedAt
      })),
      recentActivity: recentActivity.map((d) => ({
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
    const [publishedNotes, unpublishedNotes, totalUploaded, totalDownloads] = await Promise.all([
      prisma.note.count({ where: { uploadedById: adminId, status: { in: ['PUBLISHED', 'APPROVED'] } } }),
      prisma.note.count({
        where: {
          uploadedById: adminId,
          status: { in: ['UNPUBLISHED', 'DRAFT', 'PENDING', 'PENDING_REVIEW', 'REJECTED', 'ARCHIVED'] }
        }
      }),
      prisma.note.count({ where: { uploadedById: adminId } }),
      prisma.downloadHistory.count({ where: { note: { uploadedById: adminId } } })
    ]);

    const approvalRate = totalUploaded > 0 ? Number(((publishedNotes / totalUploaded) * 100).toFixed(1)) : 100;

    return {
      totalUploaded,
      publishedNotes,
      unpublishedNotes,
      totalDownloads,
      approvalRate,
      statusBreakdown: {
        PUBLISHED: publishedNotes,
        UNPUBLISHED: unpublishedNotes,
        APPROVED: publishedNotes,
        REJECTED: 0,
        PENDING: 0
      },
      recentContentActions: []
    };
  }

  /**
   * Retrieves notes for the admin workspace with published/unpublished filters.
   */
  async getNotes(adminId, query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const where = { uploadedById: adminId };

    if (query.status === 'PUBLISHED') {
      where.status = { in: ['PUBLISHED', 'APPROVED'] };
    } else if (query.status === 'UNPUBLISHED') {
      where.status = { in: ['UNPUBLISHED', 'DRAFT', 'PENDING', 'PENDING_REVIEW', 'REJECTED', 'ARCHIVED'] };
    }

    if (query.search && query.search.trim().length > 0) {
      where.title = { contains: query.search.trim() };
    }

    const [notes, total] = await Promise.all([
      prisma.note.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          course: { select: { id: true, name: true, slug: true } },
          subject: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { downloadHistory: true, reviews: true } }
        }
      }),
      prisma.note.count({ where })
    ]);

    return {
      notes: notes.map((n) => ({
        ...n,
        fileSize: n.fileSize ? n.fileSize.toString() : null,
        status: ['PUBLISHED', 'APPROVED'].includes(n.status) ? 'PUBLISHED' : 'UNPUBLISHED',
        downloads: n._count?.downloadHistory || 0,
        reviewsCount: n._count?.reviews || 0
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Moderation Queue placeholder (returns empty as approval queue is removed).
   */
  async getQueue(_query = {}) {
    return {
      notes: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0
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
