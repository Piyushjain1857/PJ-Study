import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { requirePermission } from '../../auth/requirePermission.js';
import { PERMISSIONS } from '../../auth/permissions.js';
import adminWorkspaceController from './adminWorkspace.controller.js';

const router = Router();

// Protect all admin workspace routes with authentication and moderation review permission
router.use(requireAuth);
router.use(requirePermission(PERMISSIONS.NOTES_REVIEW));

// Scoped Admin Dashboard metrics
router.get('/overview', adminWorkspaceController.getOverview);

// Scoped Content Analytics
router.get('/analytics', adminWorkspaceController.getAnalytics);

// Moderation Review Queue
router.get('/queue', adminWorkspaceController.getQueue);

// Assigned Content Reports
router.get('/reports', adminWorkspaceController.getReports);

// Moderation History
router.get('/history', adminWorkspaceController.getHistory);

export default router;
