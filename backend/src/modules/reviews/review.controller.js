import reviewService from './review.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class ReviewController {
  constructor(service = reviewService) {
    this.service = service;
  }

  /**
   * GET /api/v1/notes/:noteId/reviews
   * Retrieves visible reviews for a note.
   */
  getReviews = async (req, res, next) => {
    try {
      const noteId = req.params.noteId || req.params.id;
      const currentUserId = req.user?.id || null;
      const data = await this.service.getReviewsForNote(noteId, req.query, currentUserId);
      return sendSuccess(res, data, 200, 'Reviews retrieved successfully.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * GET /api/v1/notes/:noteId/rating-summary
   * Retrieves rating metrics and distribution.
   */
  getRatingSummary = async (req, res, next) => {
    try {
      const noteId = req.params.noteId || req.params.id;
      const data = await this.service.getRatingSummary(noteId);
      return sendSuccess(res, data, 200, 'Rating summary retrieved successfully.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * POST /api/v1/notes/:noteId/reviews
   * Submits a rating and optional review for an approved note.
   */
  submitReview = async (req, res, next) => {
    try {
      const noteId = req.params.noteId || req.params.id;
      const review = await this.service.submitReview(
        req.user.id,
        noteId,
        req.validatedBody || req.body
      );
      return sendSuccess(res, review, 201, 'Review submitted successfully.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * PATCH /api/v1/notes/:noteId/reviews/:reviewId
   * PATCH /api/v1/reviews/:reviewId
   * Updates an existing review owned by the student.
   */
  updateReview = async (req, res, next) => {
    try {
      const reviewId = req.params.reviewId || req.params.id;
      const updated = await this.service.updateReview(
        req.user.id,
        reviewId,
        req.validatedBody || req.body
      );
      return sendSuccess(res, updated, 200, 'Review updated successfully.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * DELETE /api/v1/notes/:noteId/reviews/:reviewId
   * DELETE /api/v1/reviews/:reviewId
   * Deletes a review.
   */
  deleteReview = async (req, res, next) => {
    try {
      const reviewId = req.params.reviewId || req.params.id;
      const result = await this.service.deleteReview(req.user.id, reviewId, req.user.role);
      return sendSuccess(res, result, 200, 'Review deleted successfully.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * PUT /api/v1/reviews/:reviewId/helpful
   * Votes a review as helpful.
   */
  voteHelpful = async (req, res, next) => {
    try {
      const reviewId = req.params.reviewId || req.params.id;
      const result = await this.service.voteHelpful(req.user.id, reviewId);
      return sendSuccess(res, result, 200, 'Helpful vote recorded.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * DELETE /api/v1/reviews/:reviewId/helpful
   * Removes helpful vote.
   */
  removeHelpfulVote = async (req, res, next) => {
    try {
      const reviewId = req.params.reviewId || req.params.id;
      const result = await this.service.removeHelpfulVote(req.user.id, reviewId);
      return sendSuccess(res, result, 200, 'Helpful vote removed.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * POST /api/v1/reviews/:reviewId/reports
   * Reports an inappropriate review.
   */
  reportReview = async (req, res, next) => {
    try {
      const reviewId = req.params.reviewId || req.params.id;
      const report = await this.service.reportReview(
        req.user.id,
        reviewId,
        req.validatedBody || req.body
      );
      return sendSuccess(res, report, 201, 'Report submitted for moderation review.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * GET /api/v1/admin/reviews/reports
   * Retrieves review reports for moderation dashboard.
   */
  getReports = async (req, res, next) => {
    try {
      const data = await this.service.getReports(req.query);
      return sendSuccess(res, data, 200, 'Review reports retrieved successfully.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * POST /api/v1/admin/reviews/:reviewId/hide
   * Hides an inappropriate review.
   */
  hideReview = async (req, res, next) => {
    try {
      const reviewId = req.params.reviewId || req.params.id;
      const { reason } = req.body || {};
      const updated = await this.service.hideReview(req.user.id, reviewId, reason);
      return sendSuccess(res, updated, 200, 'Review hidden by moderation.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * POST /api/v1/admin/reviews/:reviewId/restore
   * Restores a previously hidden review.
   */
  restoreReview = async (req, res, next) => {
    try {
      const reviewId = req.params.reviewId || req.params.id;
      const updated = await this.service.restoreReview(req.user.id, reviewId);
      return sendSuccess(res, updated, 200, 'Review restored to visible status.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * POST /api/v1/admin/review-reports/:reportId/dismiss
   * Dismisses an invalid report.
   */
  dismissReport = async (req, res, next) => {
    try {
      const reportId = req.params.reportId || req.params.id;
      const updated = await this.service.dismissReport(req.user.id, reportId);
      return sendSuccess(res, updated, 200, 'Report dismissed.');
    } catch (err) {
      return next(err);
    }
  };
}

export const reviewController = new ReviewController();
export default reviewController;
