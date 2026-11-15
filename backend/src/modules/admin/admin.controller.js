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

  /**
   * Returns full platform overview KPI metrics.
   */
  getOverview = async (req, res, next) => {
    try {
      const overview = await this.adminSvc.getOverview();
      return sendSuccess(res, overview);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Returns operational analytics and time-series trends.
   */
  getAnalytics = async (req, res, next) => {
    try {
      const analytics = await this.adminSvc.getAnalytics(req.query.range);
      return sendSuccess(res, analytics);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Returns moderators list with contribution metrics.
   */
  getModerators = async (req, res, next) => {
    try {
      const moderators = await this.adminSvc.getModerators(req.query);
      return sendSuccess(res, moderators);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Returns all notes across all statuses.
   */
  getNotes = async (req, res, next) => {
    try {
      const notes = await this.adminSvc.getNotes(req.query);
      return sendSuccess(res, notes);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Deletes a note permanently.
   */
  deleteNote = async (req, res, next) => {
    try {
      const result = await this.adminSvc.deleteNote(req.params.id, req.user, req.body.reason);
      return sendSuccess(res, result, 200, 'Note permanently removed by administrator.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Returns academic taxonomy records.
   */
  getAcademics = async (req, res, next) => {
    try {
      const academics = await this.adminSvc.getAcademics();
      return sendSuccess(res, academics);
    } catch (err) {
      return next(err);
    }
  };

  createCourse = async (req, res, next) => {
    try {
      const course = await this.adminSvc.createCourse(req.body, req.user);
      return sendSuccess(res, course, 201, 'Course created successfully.');
    } catch (err) {
      return next(err);
    }
  };

  updateCourse = async (req, res, next) => {
    try {
      const updated = await this.adminSvc.updateCourse(req.params.id, req.body, req.user);
      return sendSuccess(res, updated, 200, 'Course updated successfully.');
    } catch (err) {
      return next(err);
    }
  };

  createSubject = async (req, res, next) => {
    try {
      const subject = await this.adminSvc.createSubject(req.body, req.user);
      return sendSuccess(res, subject, 201, 'Subject created successfully.');
    } catch (err) {
      return next(err);
    }
  };

  updateSubject = async (req, res, next) => {
    try {
      const updated = await this.adminSvc.updateSubject(req.params.id, req.body, req.user);
      return sendSuccess(res, updated, 200, 'Subject updated successfully.');
    } catch (err) {
      return next(err);
    }
  };

  createCategory = async (req, res, next) => {
    try {
      const category = await this.adminSvc.createCategory(req.body, req.user);
      return sendSuccess(res, category, 201, 'Category created successfully.');
    } catch (err) {
      return next(err);
    }
  };

  updateCategory = async (req, res, next) => {
    try {
      const updated = await this.adminSvc.updateCategory(req.params.id, req.body, req.user);
      return sendSuccess(res, updated, 200, 'Category updated successfully.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Returns content reports (notes and reviews).
   */
  getReports = async (req, res, next) => {
    try {
      const reports = await this.adminSvc.getReports(req.query);
      return sendSuccess(res, reports);
    } catch (err) {
      return next(err);
    }
  };

  resolveReport = async (req, res, next) => {
    try {
      const result = await this.adminSvc.resolveReport(
        req.params.id,
        req.body.action,
        req.user,
        req.body.reason
      );
      return sendSuccess(res, result, 200, 'Report resolution recorded.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Returns platform settings.
   */
  getSettings = async (req, res, next) => {
    try {
      const settings = await this.adminSvc.getSettings();
      return sendSuccess(res, settings);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Updates platform settings (Super Admin).
   */
  updateSettings = async (req, res, next) => {
    try {
      const updated = await this.adminSvc.updateSettings(req.body, req.user);
      return sendSuccess(res, updated, 200, 'Platform settings saved successfully.');
    } catch (err) {
      return next(err);
    }
  };
}

export const adminController = new AdminController();
export default adminController;
