import { Router } from 'express';
import adminController from './admin.controller.js';
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

export default router;
