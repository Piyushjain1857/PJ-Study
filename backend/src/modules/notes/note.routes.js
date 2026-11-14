import { Router } from 'express';
import noteController from './note.controller.js';
import { requireAuth, optionalAuth } from '../../auth/requireAuth.js';
import { requirePermission } from '../../auth/requirePermission.js';
import { PERMISSIONS } from '../../auth/permissions.js';
import { noteUpload, handleUploadErrors } from './note.upload.js';

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

// Archive approved note
router.post('/:id/archive', requireAuth, noteController.archiveNote);

// Moderator review decision (approve or reject)
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
router.post('/:id/reviews', requireAuth, noteController.reviewNoteRating);

export default router;
