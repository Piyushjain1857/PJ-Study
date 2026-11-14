import { Router } from 'express';
import dashboardController from './dashboard.controller.js';
import { requireAuth } from '../../auth/requireAuth.js';

const router = Router();

// All dashboard endpoints require valid student authentication
router.use(requireAuth);

router.get('/overview', dashboardController.getOverview);
router.get('/analytics', dashboardController.getAnalytics);
router.get('/downloads', dashboardController.getDownloads);

export default router;
