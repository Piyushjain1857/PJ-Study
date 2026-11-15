import { Router } from 'express';
import adminController from './admin.controller.js';
import reviewController from '../reviews/review.controller.js';
import { validateUpdateUser, validateChangeRole } from './admin.validation.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { requirePermission } from '../../auth/requirePermission.js';
import { PERMISSIONS } from '../../auth/permissions.js';

const router = Router();

// Protect all administrative routes with mandatory database-backed authentication
router.use(requireAuth);

/**
 * System metadata and role definitions
 * GET /api/v1/admin/roles
 * GET /api/v1/admin/permissions
 * GET /api/v1/admin/stats
 */
router.get('/roles', requirePermission(PERMISSIONS.USERS_READ), adminController.getRoles);
router.get('/permissions', requirePermission(PERMISSIONS.USERS_READ), adminController.getRoles);
router.get('/stats', requirePermission(PERMISSIONS.USERS_READ), adminController.getStats);

/**
 * Audit log compliance trail
 * GET /api/v1/admin/audit-logs
 */
router.get(
  '/audit-logs',
  requirePermission(PERMISSIONS.AUDIT_LOGS_READ),
  adminController.getAuditLogs
);

/**
 * User directory & profile inspection
 * GET /api/v1/admin/users
 * GET /api/v1/admin/users/:id
 */
router.get('/users', requirePermission(PERMISSIONS.USERS_READ), adminController.getUsers);
router.get('/users/:id', requirePermission(PERMISSIONS.USERS_READ), adminController.getUserById);

/**
 * Profile updates & account suspension / reactivation
 * PATCH /api/v1/admin/users/:id
 */
router.patch(
  '/users/:id',
  requirePermission(PERMISSIONS.USERS_UPDATE),
  validateUpdateUser,
  adminController.updateUser
);

/**
 * Role modification
 * PATCH /api/v1/admin/users/:id/role
 */
router.patch(
  '/users/:id/role',
  requirePermission(PERMISSIONS.USERS_CHANGE_ROLE),
  validateChangeRole,
  adminController.changeUserRole
);

/**
 * Review Moderation Infrastructure
 * GET /api/v1/admin/reviews/reports
 * POST /api/v1/admin/reviews/:id/hide
 * POST /api/v1/admin/reviews/:id/restore
 * POST /api/v1/admin/review-reports/:id/dismiss
 */
router.get(
  '/reviews/reports',
  requirePermission(PERMISSIONS.NOTES_REVIEW),
  reviewController.getReports
);
router.post(
  '/reviews/:id/hide',
  requirePermission(PERMISSIONS.NOTES_REVIEW),
  reviewController.hideReview
);
router.post(
  '/reviews/:id/restore',
  requirePermission(PERMISSIONS.NOTES_REVIEW),
  reviewController.restoreReview
);
router.post(
  '/review-reports/:id/dismiss',
  requirePermission(PERMISSIONS.NOTES_REVIEW),
  reviewController.dismissReport
);

export default router;
