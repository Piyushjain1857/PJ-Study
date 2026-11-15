import prisma from '../../config/database.js';

export class ReviewRepository {
  /**
   * Finds a review by primary key ID.
   *
   * @param {string} id
   * @returns {Promise<any>}
   */
  async findById(id) {
    return prisma.review.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, role: true } },
        note: { select: { id: true, title: true, uploadedById: true, status: true } },
        _count: { select: { helpfulVotes: true, reports: true } }
      }
    });
  }

  /**
   * Finds a user's existing review for a specific note.
   *
   * @param {string} userId
   * @param {string} noteId
   * @returns {Promise<any>}
   */
  async findUserReviewForNote(userId, noteId) {
    return prisma.review.findUnique({
      where: {
        user_note_review_unique: { userId, noteId }
      },
      include: {
        _count: { select: { helpfulVotes: true } }
      }
    });
  }

  /**
   * Creates a new note review record.
   *
   * @param {{ noteId: string, userId: string, rating: number, comment?: string }} data
   * @param {any} [tx]
   * @returns {Promise<any>}
   */
  async create(data, tx = prisma) {
    return tx.review.create({
      data: {
        noteId: data.noteId,
        userId: data.userId,
        rating: data.rating,
        comment: data.comment ? data.comment.trim() : null,
        status: 'VISIBLE'
      },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, role: true } }
      }
    });
  }

  /**
   * Updates an existing review (rating and/or comment).
   *
   * @param {string} id
   * @param {{ rating?: number, comment?: string|null, status?: string }} data
   * @param {any} [tx]
   * @returns {Promise<any>}
   */
  async update(id, data, tx = prisma) {
    const updateData = {};
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.comment !== undefined) {
      updateData.comment = data.comment ? data.comment.trim() : null;
    }
    if (data.status !== undefined) updateData.status = data.status;

    return tx.review.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, role: true } },
        _count: { select: { helpfulVotes: true } }
      }
    });
  }

  /**
   * Soft-deletes a review by updating status to DELETED.
   *
   * @param {string} id
   * @param {any} [tx]
   * @returns {Promise<any>}
   */
  async softDelete(id, tx = prisma) {
    return tx.review.update({
      where: { id },
      data: { status: 'DELETED' }
    });
  }

  /**
   * Hard-deletes a review if there are no foreign key dependencies.
   *
   * @param {string} id
   * @param {any} [tx]
   * @returns {Promise<any>}
   */
  async hardDelete(id, tx = prisma) {
    return tx.review.delete({
      where: { id }
    });
  }

  /**
   * Retrieves visible reviews for a note with sorting, pagination, and current user vote status.
   *
   * @param {string} noteId
   * @param {{
   *   skip?: number,
   *   take?: number,
   *   sort?: 'newest' | 'oldest' | 'highest_rating' | 'lowest_rating' | 'most_helpful',
   *   currentUserId?: string
   * }} options
   * @returns {Promise<any[]>}
   */
  async findReviewsForNote(noteId, options = {}) {
    const { skip = 0, take = 10, sort = 'newest', currentUserId } = options;

    let orderBy = [{ createdAt: 'desc' }];
    if (sort === 'oldest') {
      orderBy = [{ createdAt: 'asc' }];
    } else if (sort === 'highest_rating') {
      orderBy = [{ rating: 'desc' }, { createdAt: 'desc' }];
    } else if (sort === 'lowest_rating') {
      orderBy = [{ rating: 'asc' }, { createdAt: 'desc' }];
    } else if (sort === 'most_helpful') {
      orderBy = [{ helpfulVotes: { _count: 'desc' } }, { createdAt: 'desc' }];
    }

    const reviews = await prisma.review.findMany({
      where: {
        noteId,
        status: 'VISIBLE'
      },
      skip,
      take,
      orderBy,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, role: true } },
        _count: { select: { helpfulVotes: true } },
        helpfulVotes: currentUserId
          ? {
              where: { userId: currentUserId },
              select: { id: true }
            }
          : false
      }
    });

    return reviews.map((r) => {
      const hasVotedHelpful = Boolean(r.helpfulVotes && r.helpfulVotes.length > 0);
      const { helpfulVotes, ...rest } = r;
      return {
        ...rest,
        helpfulCount: r._count?.helpfulVotes || 0,
        hasVotedHelpful,
        isOwner: Boolean(currentUserId && r.userId === currentUserId)
      };
    });
  }

  /**
   * Counts visible reviews for a given note.
   *
   * @param {string} noteId
   * @returns {Promise<number>}
   */
  async countReviewsForNote(noteId) {
    return prisma.review.count({
      where: {
        noteId,
        status: 'VISIBLE'
      }
    });
  }

  /**
   * Calculates accurate rating summary (average, total, and distribution 1-5).
   *
   * @param {string} noteId
   * @returns {Promise<{
   *   averageRating: number,
   *   totalRatings: number,
   *   distribution: { 1: number, 2: number, 3: number, 4: number, 5: number }
   * }>}
   */
  async getRatingSummary(noteId) {
    // 1. Compute total and average
    const aggregate = await prisma.review.aggregate({
      where: {
        noteId,
        status: 'VISIBLE'
      },
      _avg: { rating: true },
      _count: { rating: true }
    });

    // 2. Compute rating distribution counts 1-5
    const grouped = await prisma.review.groupBy({
      by: ['rating'],
      where: {
        noteId,
        status: 'VISIBLE'
      },
      _count: { rating: true }
    });

    const distribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0
    };

    for (const g of grouped) {
      if (g.rating >= 1 && g.rating <= 5) {
        distribution[g.rating] = g._count.rating;
      }
    }

    const rawAvg = aggregate._avg.rating || 0;
    const averageRating = rawAvg ? Number(rawAvg.toFixed(1)) : 0;
    const totalRatings = aggregate._count.rating || 0;

    return {
      averageRating,
      totalRatings,
      distribution
    };
  }

  // =========================================================================
  // HELPFUL VOTES
  // =========================================================================

  async findHelpfulVote(reviewId, userId) {
    return prisma.reviewHelpfulVote.findUnique({
      where: {
        review_user_helpful_unique: { reviewId, userId }
      }
    });
  }

  async createHelpfulVote(reviewId, userId, tx = prisma) {
    return tx.reviewHelpfulVote.create({
      data: { reviewId, userId }
    });
  }

  async deleteHelpfulVote(reviewId, userId, tx = prisma) {
    return tx.reviewHelpfulVote.delete({
      where: {
        review_user_helpful_unique: { reviewId, userId }
      }
    });
  }

  async countHelpfulVotes(reviewId) {
    return prisma.reviewHelpfulVote.count({
      where: { reviewId }
    });
  }

  // =========================================================================
  // REVIEW REPORTS & MODERATION
  // =========================================================================

  async findActiveReport(reviewId, reporterId) {
    return prisma.reviewReport.findFirst({
      where: {
        reviewId,
        reporterId,
        status: 'OPEN'
      }
    });
  }

  async createReport(data, tx = prisma) {
    return tx.reviewReport.create({
      data: {
        reviewId: data.reviewId,
        reporterId: data.reporterId,
        reason: data.reason,
        description: data.description ? data.description.trim() : null,
        status: 'OPEN'
      }
    });
  }

  async findReportById(id) {
    return prisma.reviewReport.findUnique({
      where: { id },
      include: {
        review: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            note: { select: { id: true, title: true } }
          }
        },
        reporter: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true } }
      }
    });
  }

  async updateReportStatus(reportId, status, reviewedById, tx = prisma) {
    return tx.reviewReport.update({
      where: { id: reportId },
      data: {
        status,
        reviewedById,
        reviewedAt: new Date()
      }
    });
  }

  async findReports(options = {}) {
    const { skip = 0, take = 20, status = 'OPEN' } = options;

    const where = {};
    if (status) {
      where.status = status;
    }

    return prisma.reviewReport.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        review: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            note: { select: { id: true, title: true } },
            _count: { select: { helpfulVotes: true, reports: true } }
          }
        },
        reporter: { select: { id: true, name: true, email: true } },
        reviewedBy: { select: { id: true, name: true } }
      }
    });
  }

  async countReports(options = {}) {
    const { status = 'OPEN' } = options;
    const where = {};
    if (status) where.status = status;
    return prisma.reviewReport.count({ where });
  }
}

export const reviewRepository = new ReviewRepository();
export default reviewRepository;
