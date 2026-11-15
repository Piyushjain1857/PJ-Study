import adminWorkspaceService from './adminWorkspace.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class AdminWorkspaceController {
  constructor(service = adminWorkspaceService) {
    this.service = service;
  }

  getOverview = async (req, res, next) => {
    try {
      const data = await this.service.getOverview(req.user.id);
      return sendSuccess(res, data, 200, 'Admin workspace overview retrieved successfully.');
    } catch (err) {
      return next(err);
    }
  };

  getAnalytics = async (req, res, next) => {
    try {
      const data = await this.service.getAnalytics(req.user.id);
      return sendSuccess(res, data, 200, 'Admin workspace analytics retrieved successfully.');
    } catch (err) {
      return next(err);
    }
  };

  getNotes = async (req, res, next) => {
    try {
      const data = await this.service.getNotes(req.user.id, req.query);
      return sendSuccess(res, data, 200, 'Admin notes retrieved successfully.');
    } catch (err) {
      return next(err);
    }
  };

  getQueue = async (req, res, next) => {
    try {
      const data = await this.service.getQueue(req.query);
      return sendSuccess(res, data, 200, 'Moderation queue retrieved successfully.');
    } catch (err) {
      return next(err);
    }
  };

  getReports = async (req, res, next) => {
    try {
      const data = await this.service.getReports(req.query);
      return sendSuccess(res, data, 200, 'Content reports retrieved successfully.');
    } catch (err) {
      return next(err);
    }
  };

  getHistory = async (req, res, next) => {
    try {
      const data = await this.service.getHistory(req.user.id, req.query);
      return sendSuccess(res, data, 200, 'Moderation history retrieved successfully.');
    } catch (err) {
      return next(err);
    }
  };
}

export const adminWorkspaceController = new AdminWorkspaceController();
export default adminWorkspaceController;
