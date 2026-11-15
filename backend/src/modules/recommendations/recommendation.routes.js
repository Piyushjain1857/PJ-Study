import { Router } from 'express';
import recommendationController from './recommendation.controller.js';
import { requireAuth, optionalAuth } from '../../auth/requireAuth.js';

const router = Router();

// Personalized recommendations (requires student login)
router.get('/notes', requireAuth, recommendationController.getPersonalized);
router.get('/notes/subjects', requireAuth, recommendationController.getSubjectRecommendations);

// Public / discovery-driven recommendations
router.get('/notes/similar/:noteId', optionalAuth, recommendationController.getSimilar);
router.get('/notes/recent', optionalAuth, recommendationController.getRecent);
router.get('/notes/popular', optionalAuth, recommendationController.getPopular);

export default router;
