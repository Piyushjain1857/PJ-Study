import { Router } from 'express';
import adminController from './admin.controller.js';
import reviewController from '../reviews/review.controller.js';
import notificationController from '../notifications/notification.controller.js';
import { validateUpdateUser, validateChangeRole } from './admin.validation.js';
import { validateCreateAnnouncement } from '../notifications/notification.validation.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { requireRole } from '../../auth/requireRole.js';
import { requirePermission } from '../../auth/requirePermission.js';
import { PERMISSIONS } from '../../auth/permissions.js';
import { ROLES } from '../../auth/rolePermissions.js';

const router = Router();

// Protect all administrative routes with mandatory database-backed authentication
router.use(requireAuth);

/**
 * System metadata and role definitions
 * GET /api/v1/admin/roles
 * GET /api/v1/admin/permissions
 * GET /api/v1/admin/stats
 * GET /api/v1/admin/overview
 * GET /api/v1/admin/analytics
 */
router.get('/roles', requirePermission(PERMISSIONS.USERS_READ), adminController.getRoles);
router.get('/permissions', requirePermission(PERMISSIONS.USERS_READ), adminController.getRoles);
router.get('/stats', requirePermission(PERMISSIONS.USERS_READ), adminController.getStats);
router.get('/overview', requirePermission(PERMISSIONS.USERS_READ), adminController.getOverview);
router.get('/analytics', requirePermission(PERMISSIONS.USERS_READ), adminController.getAnalytics);

/**
 * Staff and Moderator Management
 * GET /api/v1/admin/moderators
 */
router.get('/moderators', requirePermission(PERMISSIONS.USERS_READ), adminController.getModerators);

/**
 * Complete Notes Directory & Management
 * GET /api/v1/admin/notes
 * DELETE /api/v1/admin/notes/:id
 */
router.get('/notes', requirePermission(PERMISSIONS.NOTES_MANAGE_ALL), adminController.getNotes);
router.delete(
  '/notes/:id',
  requirePermission(PERMISSIONS.NOTES_MANAGE_ALL),
  adminController.deleteNote
);

/**
 * Academic Content Management (Courses, Subjects, Categories)
 * GET /api/v1/admin/academics
 * POST/PATCH /api/v1/admin/academics/courses
 * POST/PATCH /api/v1/admin/academics/subjects
 * POST/PATCH /api/v1/admin/academics/categories
 */
router.get(
  '/academics',
  requirePermission(PERMISSIONS.CATEGORIES_MANAGE),
  adminController.getAcademics
);
router.post(
  '/academics/courses',
  requirePermission(PERMISSIONS.CATEGORIES_MANAGE),
  adminController.createCourse
);
router.patch(
  '/academics/courses/:id',
  requirePermission(PERMISSIONS.CATEGORIES_MANAGE),
  adminController.updateCourse
);
router.post(
  '/academics/subjects',
  requirePermission(PERMISSIONS.CATEGORIES_MANAGE),
  adminController.createSubject
);
router.patch(
  '/academics/subjects/:id',
  requirePermission(PERMISSIONS.CATEGORIES_MANAGE),
  adminController.updateSubject
);
router.post(
  '/academics/categories',
  requirePermission(PERMISSIONS.CATEGORIES_MANAGE),
  adminController.createCategory
);
router.patch(
  '/academics/categories/:id',
  requirePermission(PERMISSIONS.CATEGORIES_MANAGE),
  adminController.updateCategory
);

/**
 * Unified Reports & Review Moderation
 * GET /api/v1/admin/reports
 * POST /api/v1/admin/reports/:id/resolve
 */
router.get(
  '/reports',
  requirePermission(PERMISSIONS.NOTES_REVIEW),
  adminController.getReports
);
router.post(
  '/reports/:id/resolve',
  requirePermission(PERMISSIONS.NOTES_REVIEW),
  adminController.resolveReport
);

/**
 * Platform Configuration Settings
 * GET /api/v1/admin/settings
 * PATCH /api/v1/admin/settings (Super Admin only)
 */
router.get(
  '/settings',
  requirePermission(PERMISSIONS.USERS_READ),
  adminController.getSettings
);
router.patch(
  '/settings',
  requireRole(ROLES.SUPER_ADMIN),
  adminController.updateSettings
);

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

/**
 * Administrative Platform Announcements
 * POST /api/v1/admin/announcements
 * GET /api/v1/admin/announcements
 */
router.post(
  '/announcements',
  requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  validateCreateAnnouncement,
  notificationController.createAnnouncement
);
router.get(
  '/announcements',
  requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  notificationController.getAnnouncements
);

export default router;
