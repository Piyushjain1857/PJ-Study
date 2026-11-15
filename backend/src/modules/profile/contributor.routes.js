import { Router } from 'express';
import profileController from './profile.controller.js';

const router = Router();

// Public contributor profile
router.get('/:userId', profileController.getContributorProfile);

// Public contributor approved notes
router.get('/:userId/notes', profileController.getContributorNotes);

export default router;
