import prisma from '../../config/database.js';

/**
 * Format note record for JSON responses, converting BigInt fileSize to number/string.
 */
function sanitizeNoteFile(note) {
  if (!note) return null;
  return {
    ...note,
    fileSize: typeof note.fileSize === 'bigint' ? note.fileSize.toString() : note.fileSize
  };
}

export class DashboardRepository {
  /**
   * Retrieves summary metric counts for the student.
   *
   * @param {string} userId
   * @returns {Promise<{
   *   savedNotesCount: number,
   *   collectionsCount: number,
   *   downloadsCount: number,
   *   uniqueNotesDownloaded: number,
   *   uploadsCount: number
   * }>}
   */
  async getStudentCounts(userId) {
    const [savedNotesCount, collectionsCount, downloadsCount, uniqueNotes, uploadsCount] =
      await Promise.all([
        prisma.bookmark.count({ where: { userId } }),
        prisma.studyCollection.count({ where: { userId } }),
        prisma.downloadHistory.count({ where: { userId } }),
        prisma.downloadHistory.findMany({
          where: { userId },
          distinct: ['noteId'],
          select: { noteId: true }
        }),
        prisma.note.count({ where: { uploadedById: userId } })
      ]);

    return {
      savedNotesCount,
      collectionsCount,
      downloadsCount,
      uniqueNotesDownloaded: uniqueNotes.length,
      uploadsCount
    };
  }

  /**
   * Retrieves recently saved (bookmarked) notes.
   *
   * @param {string} userId
   * @param {number} limit
   */
  async getRecentBookmarks(userId, limit = 5) {
    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        note: {
          select: {
            id: true,
            title: true,
            slug: true,
            description: true,
            status: true,
            downloadCount: true,
            viewCount: true,
            createdAt: true,
            subject: { select: { name: true, slug: true } },
            course: { select: { name: true, slug: true } },
            category: { select: { name: true, slug: true } },
            uploadedBy: { select: { name: true } }
          }
        }
      }
    });

    return bookmarks.map((b) => ({
      id: b.id,
      bookmarkedAt: b.createdAt,
      note: b.note
    }));
  }

  /**
   * Retrieves recently uploaded notes by the student.
   *
   * @param {string} userId
   * @param {number} limit
   */
  async getRecentUploads(userId, limit = 5) {
    return prisma.note.findMany({
      where: { uploadedById: userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        downloadCount: true,
        viewCount: true,
        createdAt: true,
        subject: { select: { name: true, slug: true } },
        course: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true } }
      }
    });
  }

  /**
   * Retrieves collections owned by the student.
   *
   * @param {string} userId
   * @param {number} limit
   */
  async getRecentCollections(userId, limit = 5) {
    const collections = await prisma.studyCollection.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      include: {
        _count: {
          select: { items: true }
        }
      }
    });

    return collections.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      noteCount: c._count.items,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt
    }));
  }

  /**
   * Retrieves recent download events.
   *
   * @param {string} userId
   * @param {number} limit
   */
  async getRecentDownloads(userId, limit = 5) {
    const history = await prisma.downloadHistory.findMany({
      where: { userId },
      orderBy: { downloadedAt: 'desc' },
      take: limit,
      include: {
        note: {
          select: {
            id: true,
            title: true,
            slug: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            subject: { select: { name: true } },
            course: { select: { name: true } }
          }
        }
      }
    });

    return history.map((item) => ({
      id: item.id,
      downloadedAt: item.downloadedAt,
      note: sanitizeNoteFile(item.note)
    }));
  }

  /**
   * Retrieves top recommended approved study notes.
   *
   * @param {string} userId
   * @param {number} limit
   */
  async getRecommendedNotes(userId, limit = 4) {
    let notes = await prisma.note.findMany({
      where: {
        status: 'APPROVED',
        uploadedById: { not: userId }
      },
      orderBy: [{ downloadCount: 'desc' }, { viewCount: 'desc' }],
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        downloadCount: true,
        viewCount: true,
        subject: { select: { name: true, slug: true } },
        course: { select: { name: true, slug: true } },
        category: { select: { name: true, slug: true } },
        uploadedBy: { select: { name: true } }
      }
    });

    if (notes.length < limit) {
      notes = await prisma.note.findMany({
        where: { status: 'APPROVED' },
        orderBy: [{ downloadCount: 'desc' }, { viewCount: 'desc' }],
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          downloadCount: true,
          viewCount: true,
          subject: { select: { name: true, slug: true } },
          course: { select: { name: true, slug: true } },
          category: { select: { name: true, slug: true } },
          uploadedBy: { select: { name: true } }
        }
      });
    }

    return notes;
  }

  /**
   * Aggregates activity metrics over a given date range.
   *
   * @param {string} userId
   * @param {Date} startDate
   * @param {Date} endDate
   */
  async getActivityTimeline(userId, startDate, endDate) {
    const [bookmarksRaw, downloadsRaw, uploadsRaw, collectionsRaw] = await Promise.all([
      prisma.$queryRaw`
        SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, COUNT(*) as count
        FROM bookmarks
        WHERE user_id = ${userId} AND created_at >= ${startDate} AND created_at <= ${endDate}
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
      `,
      prisma.$queryRaw`
        SELECT DATE_FORMAT(downloaded_at, '%Y-%m-%d') as date, COUNT(*) as count
        FROM download_history
        WHERE user_id = ${userId} AND downloaded_at >= ${startDate} AND downloaded_at <= ${endDate}
        GROUP BY DATE_FORMAT(downloaded_at, '%Y-%m-%d')
      `,
      prisma.$queryRaw`
        SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, COUNT(*) as count
        FROM notes
        WHERE uploaded_by_id = ${userId} AND created_at >= ${startDate} AND created_at <= ${endDate}
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
      `,
      prisma.$queryRaw`
        SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as date, COUNT(*) as count
        FROM study_collections
        WHERE user_id = ${userId} AND created_at >= ${startDate} AND created_at <= ${endDate}
        GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
      `
    ]);

    // Build lookup maps by date string YYYY-MM-DD
    const bookmarksMap = new Map();
    for (const row of bookmarksRaw) {
      bookmarksMap.set(row.date, Number(row.count));
    }

    const downloadsMap = new Map();
    for (const row of downloadsRaw) {
      downloadsMap.set(row.date, Number(row.count));
    }

    const uploadsMap = new Map();
    for (const row of uploadsRaw) {
      uploadsMap.set(row.date, Number(row.count));
    }

    const collectionsMap = new Map();
    for (const row of collectionsRaw) {
      collectionsMap.set(row.date, Number(row.count));
    }

    // Generate chronological daily buckets from startDate to endDate
    const timeline = [];
    let cur = new Date(startDate);
    const end = new Date(endDate);

    let totalBookmarks = 0;
    let totalDownloads = 0;
    let totalUploads = 0;
    let totalCollections = 0;

    while (cur <= end) {
      const dateStr = cur.toISOString().split('T')[0];
      const bookmarks = bookmarksMap.get(dateStr) || 0;
      const downloads = downloadsMap.get(dateStr) || 0;
      const uploads = uploadsMap.get(dateStr) || 0;
      const collections = collectionsMap.get(dateStr) || 0;

      totalBookmarks += bookmarks;
      totalDownloads += downloads;
      totalUploads += uploads;
      totalCollections += collections;

      timeline.push({
        date: dateStr,
        bookmarks,
        downloads,
        uploads,
        collections,
        total: bookmarks + downloads + uploads + collections
      });

      cur.setUTCDate(cur.getUTCDate() + 1);
    }

    return {
      totals: {
        bookmarks: totalBookmarks,
        downloads: totalDownloads,
        uploads: totalUploads,
        collections: totalCollections,
        totalEvents: totalBookmarks + totalDownloads + totalUploads + totalCollections
      },
      timeline
    };
  }

  /**
   * Retrieves paginated download history for the user.
   *
   * @param {string} userId
   * @param {number} skip
   * @param {number} take
   */
  async getDownloadHistoryPaginated(userId, skip = 0, take = 10) {
    const [total, items] = await Promise.all([
      prisma.downloadHistory.count({ where: { userId } }),
      prisma.downloadHistory.findMany({
        where: { userId },
        orderBy: { downloadedAt: 'desc' },
        skip,
        take,
        include: {
          note: {
            select: {
              id: true,
              title: true,
              slug: true,
              fileName: true,
              fileSize: true,
              mimeType: true,
              subject: { select: { name: true } },
              course: { select: { name: true } }
            }
          }
        }
      })
    ]);

    return {
      total,
      items: items.map((item) => ({
        id: item.id,
        downloadedAt: item.downloadedAt,
        note: sanitizeNoteFile(item.note)
      }))
    };
  }
}

export const dashboardRepository = new DashboardRepository();
export default dashboardRepository;
