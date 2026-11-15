import { Router } from 'express';
import reviewController from './review.controller.js';
import { validateUpdateReview, validateReportReview } from './review.validation.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { reviewSubmissionLimiter, reportSubmissionLimiter } from '../../middleware/rateLimiters.js';

const router = Router();

// Helpful voting routes
router.put('/:id/helpful', requireAuth, reviewController.voteHelpful);
router.delete('/:id/helpful', requireAuth, reviewController.removeHelpfulVote);

// Review reporting route
router.post(
  '/:id/reports',
  requireAuth,
  reportSubmissionLimiter,
  validateReportReview,
  reviewController.reportReview
);

// Direct review edit and deletion routes
router.patch(
  '/:id',
  requireAuth,
  reviewSubmissionLimiter,
  validateUpdateReview,
  reviewController.updateReview
);
router.delete('/:id', requireAuth, reviewController.deleteReview);

export default router;
