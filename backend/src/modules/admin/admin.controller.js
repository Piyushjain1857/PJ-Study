import adminService, { AdminService } from './admin.service.js';
import auditService, { AuditService } from '../audit/audit.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

/**
 * Controller handling HTTP endpoints for administrative governance and role management.
 */
export class AdminController {
  /**
   * @param {object} [deps]
   * @param {AdminService} [deps.adminSvc]
   * @param {AuditService} [deps.auditSvc]
   */
  constructor({ adminSvc = adminService, auditSvc = auditService } = {}) {
    this.adminSvc = adminSvc;
    this.auditSvc = auditSvc;
  }

  /**
   * Returns paginated, filtered, and searchable user list.
   */
  getUsers = async (req, res, next) => {
    try {
      const result = await this.adminSvc.getUsers(req.query);
      return sendSuccess(res, result);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Returns individual user profile with academic metrics.
   */
  getUserById = async (req, res, next) => {
    try {
      const user = await this.adminSvc.getUserById(req.params.id);
      return sendSuccess(res, user);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Updates basic profile or active/suspended status.
   */
  updateUser = async (req, res, next) => {
    try {
      const updated = await this.adminSvc.updateUser(req.params.id, req.body, req.user);
      return sendSuccess(res, updated, 200, 'User updated successfully.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Modifies a user's role.
   */
  changeUserRole = async (req, res, next) => {
    try {
      const updated = await this.adminSvc.changeUserRole(
        req.params.id,
        req.body.role,
        req.body.reason,
        req.user
      );
      return sendSuccess(res, updated, 200, `User role successfully changed to ${req.body.role}.`);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Returns role definitions and permission capabilities.
   */
  getRoles = async (req, res, next) => {
    try {
      const data = await this.adminSvc.getRolesAndPermissions();
      return sendSuccess(res, data);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Returns paginated audit logs.
   */
  getAuditLogs = async (req, res, next) => {
    try {
      const result = await this.auditSvc.getAuditLogs(req.query);
      return sendSuccess(res, result);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Returns system stats and user counts by role.
   */
  getStats = async (req, res, next) => {
    try {
      const stats = await this.adminSvc.getStats();
      return sendSuccess(res, stats);
    } catch (err) {
      return next(err);
    }
  };
}

export const adminController = new AdminController();
export default adminController;
