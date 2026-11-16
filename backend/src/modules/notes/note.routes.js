import { Router } from 'express';
import noteController from './note.controller.js';
import { requireAuth, optionalAuth } from '../../auth/requireAuth.js';
import { requirePermission } from '../../auth/requirePermission.js';
import { PERMISSIONS } from '../../auth/permissions.js';
import { noteUpload, handleUploadErrors } from './note.upload.js';
import { fileUploadLimiter, reviewSubmissionLimiter } from '../../middleware/rateLimiters.js';
import reviewController from '../reviews/review.controller.js';
import {
  validateSubmitReview,
  validateUpdateReview,
  validateReviewQuery
} from '../reviews/review.validation.js';

const router = Router();

// =============================================================================
// LISTING & QUEUES (order matters so /me and /moderation don't match /:id)
// =============================================================================

// Public note reading & discovery (approved notes only)
router.get('/', noteController.listNotes);
router.get('/explore', noteController.exploreNotes);
router.get('/explore/filters', noteController.getExploreFilters);

// Current scholar's personal notes dashboard
router.get('/me', requireAuth, noteController.getMyNotes);

// Current scholar's bookmarked notes
router.get('/bookmarks', requireAuth, noteController.getBookmarkedNotes);

// Moderation queue for academic staff
router.get(
  '/moderation/queue',
  requireAuth,
  requirePermission(PERMISSIONS.NOTES_REVIEW),
  noteController.getModerationQueue
);

// =============================================================================
// SINGLE NOTE DETAILS & FILE STREAMING
// =============================================================================

router.get('/:id', optionalAuth, noteController.getNoteById);
router.get('/:id/file', optionalAuth, noteController.downloadFile);
router.get('/:id/download', optionalAuth, noteController.downloadFile);

// =============================================================================
// CREATION & MODIFICATION
// =============================================================================

// Authenticated note creation (with optional file upload)
router.post(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.NOTES_CREATE),
  fileUploadLimiter,
  noteUpload.single('file'),
  handleUploadErrors,
  noteController.createNote
);

// Ownership-enforced note updating & deletion
router.patch(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.NOTES_UPDATE_OWN),
  noteUpload.single('file'),
  handleUploadErrors,
  noteController.updateNote
);

router.delete(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.NOTES_DELETE_OWN),
  noteController.deleteNote
);

// =============================================================================
// LIFECYCLE STATE TRANSITIONS
// =============================================================================

// Submit draft or rejected note for moderation review
router.post(
  '/:id/submit',
  requireAuth,
  requirePermission(PERMISSIONS.NOTES_SUBMIT_REVIEW),
  noteController.submitNote
);

// Archive note
router.post(
  '/:id/archive',
  requireAuth,
  requirePermission(PERMISSIONS.NOTES_UPDATE_OWN),
  noteController.archiveNote
);

// Direct publish & unpublish
router.patch(
  '/:id/publish',
  requireAuth,
  requirePermission(PERMISSIONS.NOTES_UPDATE_OWN),
  noteController.publishNote
);

router.patch(
  '/:id/unpublish',
  requireAuth,
  requirePermission(PERMISSIONS.NOTES_UPDATE_OWN),
  noteController.unpublishNote
);

// Review decision (legacy compatibility)
router.post(
  '/:id/review',
  requireAuth,
  requirePermission(PERMISSIONS.NOTES_REVIEW),
  noteController.reviewNote
);

// =============================================================================
// BOOKMARKS & REVIEWS
// =============================================================================

router.post('/:id/bookmark', requireAuth, noteController.bookmarkNote);
router.delete('/:id/bookmark', requireAuth, noteController.removeBookmark);

// Notes Ratings, Reviews & Quality Feedback
router.get('/:id/reviews', optionalAuth, validateReviewQuery, reviewController.getReviews);
router.get('/:id/rating-summary', reviewController.getRatingSummary);
router.post(
  '/:id/reviews',
  requireAuth,
  reviewSubmissionLimiter,
  validateSubmitReview,
  reviewController.submitReview
);
router.patch(
  '/:id/reviews/:reviewId',
  requireAuth,
  reviewSubmissionLimiter,
  validateUpdateReview,
  reviewController.updateReview
);
router.delete('/:id/reviews/:reviewId', requireAuth, reviewController.deleteReview);

export default router;
