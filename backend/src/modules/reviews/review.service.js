import reviewRepository from './review.repository.js';
import noteRepository from '../notes/note.repository.js';
import auditService from '../audit/audit.service.js';
import { getPaginationParams, buildPaginatedResponse } from '../../utils/pagination.js';
import prisma from '../../config/database.js';

export class ReviewService {
  constructor(repo = reviewRepository, noteRepo = noteRepository, audit = auditService) {
    this.repo = repo;
    this.noteRepo = noteRepo;
    this.audit = audit;
  }

  /**
   * Retrieves visible reviews for a note with sorting, pagination, and current user vote status.
   *
   * @param {string} noteId
   * @param {object} query
   * @param {string} [currentUserId]
   * @returns {Promise<any>}
   */
  async getReviewsForNote(noteId, query = {}, currentUserId = null) {
    const note = await this.noteRepo.findById(noteId);
    if (!note) {
      const error = new Error(`Note with ID "${noteId}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    const { page, limit, skip } = getPaginationParams(query);
    const sort = query.sort || 'newest';

    const [reviews, total] = await Promise.all([
      this.repo.findReviewsForNote(noteId, { skip, take: limit, sort, currentUserId }),
      this.repo.countReviewsForNote(noteId)
    ]);

    return buildPaginatedResponse(reviews, total, page, limit);
  }

  /**
   * Retrieves rating summary and distribution for a note.
   *
   * @param {string} noteId
   * @returns {Promise<{
   *   averageRating: number,
   *   totalRatings: number,
   *   distribution: { 1: number, 2: number, 3: number, 4: number, 5: number }
   * }>}
   */
  async getRatingSummary(noteId) {
    const note = await this.noteRepo.findById(noteId);
    if (!note) {
      const error = new Error(`Note with ID "${noteId}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    return this.repo.getRatingSummary(noteId);
  }

  /**
   * Submits a rating and optional review for an approved note.
   * Prevents self-reviews and maintains a single active review per user-note pair.
   *
   * @param {string} userId
   * @param {string} noteId
   * @param {{ rating: number, comment?: string }} data
   * @returns {Promise<any>}
   */
  async submitReview(userId, noteId, data) {
    const note = await this.noteRepo.findById(noteId);
    if (!note) {
      const error = new Error(`Note with ID "${noteId}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    // Eligibility Rule: Only APPROVED notes can be reviewed
    if (note.status !== 'APPROVED') {
      const error = new Error(
        `Reviews are only permitted on approved manuscripts. This note status is "${note.status}".`
      );
      error.statusCode = 400;
      throw error;
    }

    // Anti-Abuse Invariant: Authors cannot review their own notes
    if (note.uploadedById === userId) {
      const error = new Error(
        'Authors are not permitted to rate or review their own uploaded notes.'
      );
      error.statusCode = 403;
      throw error;
    }

    const existingReview = await this.repo.findUserReviewForNote(userId, noteId);

    if (existingReview) {
      if (existingReview.status === 'HIDDEN') {
        const error = new Error(
          'Your previous review for this manuscript was hidden by moderation and cannot be modified.'
        );
        error.statusCode = 403;
        throw error;
      }

      // If previously deleted or active, update existing review record
      return this.repo.update(existingReview.id, {
        rating: data.rating,
        comment: data.comment,
        status: 'VISIBLE'
      });
    }

    // Create new review
    return this.repo.create({
      noteId,
      userId,
      rating: data.rating,
      comment: data.comment
    });
  }

  /**
   * Edits an existing review owned by the student.
   *
   * @param {string} userId
   * @param {string} reviewId
   * @param {{ rating?: number, comment?: string }} data
   * @returns {Promise<any>}
   */
  async updateReview(userId, reviewId, data) {
    const review = await this.repo.findById(reviewId);
    if (!review || review.status === 'DELETED') {
      const error = new Error(`Review with ID "${reviewId}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    // Ownership Verification
    if (review.userId !== userId) {
      const error = new Error('You are only authorized to edit your own review.');
      error.statusCode = 403;
      throw error;
    }

    // Moderation Guard
    if (review.status === 'HIDDEN') {
      const error = new Error(
        'This review has been moderated and hidden from public view. Edits are disabled.'
      );
      error.statusCode = 403;
      throw error;
    }

    return this.repo.update(reviewId, data);
  }

  /**
   * Deletes a review owned by the student or removes it as moderator.
   *
   * @param {string} userId
   * @param {string} reviewId
   * @param {string} userRole
   * @returns {Promise<{ message: string }>}
   */
  async deleteReview(userId, reviewId, userRole) {
    const review = await this.repo.findById(reviewId);
    if (!review || review.status === 'DELETED') {
      const error = new Error(`Review with ID "${reviewId}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    const isModerator = ['MODERATOR', 'ADMIN', 'SUPER_ADMIN'].includes(userRole);
    if (review.userId !== userId && !isModerator) {
      const error = new Error('You are only authorized to delete your own review.');
      error.statusCode = 403;
      throw error;
    }

    await this.repo.softDelete(reviewId);

    if (isModerator && review.userId !== userId) {
      await this.audit.logAction({
        actorId: userId,
        action: 'review:delete',
        entityType: 'review',
        entityId: reviewId,
        metadata: { noteId: review.noteId, authorId: review.userId }
      });
    }

    return { message: 'Review successfully removed.' };
  }

  // =========================================================================
  // HELPFUL VOTES
  // =========================================================================

  /**
   * Casts a helpful vote on a visible review.
   *
   * @param {string} userId
   * @param {string} reviewId
   * @returns {Promise<{ helpfulCount: number }>}
   */
  async voteHelpful(userId, reviewId) {
    const review = await this.repo.findById(reviewId);
    if (!review || review.status !== 'VISIBLE') {
      const error = new Error('Review not found or not currently visible.');
      error.statusCode = 404;
      throw error;
    }

    // Anti-Abuse: Cannot vote own review as helpful
    if (review.userId === userId) {
      const error = new Error('You cannot vote your own review as helpful.');
      error.statusCode = 400;
      throw error;
    }

    const existingVote = await this.repo.findHelpfulVote(reviewId, userId);
    if (!existingVote) {
      await this.repo.createHelpfulVote(reviewId, userId);
    }

    const count = await this.repo.countHelpfulVotes(reviewId);
    return { helpfulCount: count };
  }

  /**
   * Removes a previously cast helpful vote.
   *
   * @param {string} userId
   * @param {string} reviewId
   * @returns {Promise<{ helpfulCount: number }>}
   */
  async removeHelpfulVote(userId, reviewId) {
    const existingVote = await this.repo.findHelpfulVote(reviewId, userId);
    if (existingVote) {
      await this.repo.deleteHelpfulVote(reviewId, userId);
    }

    const count = await this.repo.countHelpfulVotes(reviewId);
    return { helpfulCount: count };
  }

  // =========================================================================
  // REVIEW REPORTS & MODERATION
  // =========================================================================

  /**
   * Reports an inappropriate review.
   *
   * @param {string} userId
   * @param {string} reviewId
   * @param {{ reason: string, description?: string }} data
   * @returns {Promise<any>}
   */
  async reportReview(userId, reviewId, data) {
    const review = await this.repo.findById(reviewId);
    if (!review || review.status === 'DELETED') {
      const error = new Error('Review not found or has been removed.');
      error.statusCode = 404;
      throw error;
    }

    // Prevent duplicate unresolved reports
    const existingActive = await this.repo.findActiveReport(reviewId, userId);
    if (existingActive) {
      const error = new Error('You have already submitted an active report for this review.');
      error.statusCode = 409;
      throw error;
    }

    return this.repo.createReport({
      reviewId,
      reporterId: userId,
      reason: data.reason,
      description: data.description
    });
  }

  /**
   * Retrieves paginated review reports for moderation dashboard.
   *
   * @param {object} query
   * @returns {Promise<any>}
   */
  async getReports(query = {}) {
    const { page, limit, skip } = getPaginationParams(query);
    const status = query.status || 'OPEN';

    const [reports, total] = await Promise.all([
      this.repo.findReports({ skip, take: limit, status }),
      this.repo.countReports({ status })
    ]);

    return buildPaginatedResponse(reports, total, page, limit);
  }

  /**
   * Hides an inappropriate review (moderator action).
   *
   * @param {string} moderatorId
   * @param {string} reviewId
   * @param {string} [reason]
   * @returns {Promise<any>}
   */
  async hideReview(moderatorId, reviewId, reason = 'Violates community standards') {
    const review = await this.repo.findById(reviewId);
    if (!review) {
      const error = new Error(`Review with ID "${reviewId}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      const updated = await this.repo.update(reviewId, { status: 'HIDDEN' }, tx);

      // Action all open reports for this review
      await tx.reviewReport.updateMany({
        where: { reviewId, status: 'OPEN' },
        data: {
          status: 'ACTIONED',
          reviewedById: moderatorId,
          reviewedAt: new Date()
        }
      });

      // Audit log entry
      await this.audit.logAction(
        {
          actorId: moderatorId,
          action: 'review:hide',
          entityType: 'review',
          entityId: reviewId,
          metadata: { reason, noteId: review.noteId, authorId: review.userId }
        },
        tx
      );

      return updated;
    });
  }

  /**
   * Restores a previously hidden review (moderator action).
   *
   * @param {string} moderatorId
   * @param {string} reviewId
   * @returns {Promise<any>}
   */
  async restoreReview(moderatorId, reviewId) {
    const review = await this.repo.findById(reviewId);
    if (!review) {
      const error = new Error(`Review with ID "${reviewId}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      const updated = await this.repo.update(reviewId, { status: 'VISIBLE' }, tx);

      await this.audit.logAction(
        {
          actorId: moderatorId,
          action: 'review:restore',
          entityType: 'review',
          entityId: reviewId,
          metadata: { noteId: review.noteId, authorId: review.userId }
        },
        tx
      );

      return updated;
    });
  }

  /**
   * Dismisses an invalid report on a review.
   *
   * @param {string} moderatorId
   * @param {string} reportId
   * @returns {Promise<any>}
   */
  async dismissReport(moderatorId, reportId) {
    const report = await this.repo.findReportById(reportId);
    if (!report) {
      const error = new Error(`Report with ID "${reportId}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      const updated = await this.repo.updateReportStatus(reportId, 'DISMISSED', moderatorId, tx);

      await this.audit.logAction(
        {
          actorId: moderatorId,
          action: 'review_report:dismiss',
          entityType: 'review_report',
          entityId: reportId,
          metadata: { reviewId: report.reviewId, reason: report.reason }
        },
        tx
      );

      return updated;
    });
  }
}

export const reviewService = new ReviewService();
export default reviewService;
