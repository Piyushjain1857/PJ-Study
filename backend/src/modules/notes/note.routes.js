import { Router } from 'express';
import noteController from './note.controller.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { requirePermission } from '../../auth/requirePermission.js';
import { PERMISSIONS } from '../../auth/permissions.js';

const router = Router();

// Public note reading
router.get('/', noteController.listNotes);
router.get('/:id', noteController.getNoteById);

// Authenticated note creation
router.post(
  '/',
  requireAuth,
  requirePermission(PERMISSIONS.NOTES_CREATE),
  noteController.createNote
);

// Ownership-enforced note updating & deletion
router.patch(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.NOTES_UPDATE_OWN),
  noteController.updateNote
);

router.delete(
  '/:id',
  requireAuth,
  requirePermission(PERMISSIONS.NOTES_DELETE_OWN),
  noteController.deleteNote
);

// Moderation review
router.post(
  '/:id/review',
  requireAuth,
  requirePermission(PERMISSIONS.NOTES_REVIEW),
  noteController.reviewNote
);

export default router;

