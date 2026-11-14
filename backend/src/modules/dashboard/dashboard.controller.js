import dashboardService from './dashboard.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class DashboardController {
  constructor(service = dashboardService) {
    this.service = service;
  }

  /**
   * GET /api/v1/dashboard/overview
   */
  getOverview = async (req, res, next) => {
    try {
      const data = await this.service.getStudentOverview(req.user.id);
      return sendSuccess(res, data, 200, 'Dashboard overview retrieved successfully.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * GET /api/v1/dashboard/analytics
   */
  getAnalytics = async (req, res, next) => {
    try {
      const range = req.query.range || '7d';
      const data = await this.service.getStudentAnalytics(req.user.id, range);
      return sendSuccess(res, data, 200, 'Activity analytics retrieved successfully.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * GET /api/v1/dashboard/downloads
   */
  getDownloads = async (req, res, next) => {
    try {
      const data = await this.service.getStudentDownloads(req.user.id, req.query);
      return sendSuccess(res, data, 200, 'Download history retrieved successfully.');
    } catch (err) {
      return next(err);
    }
  };
}

export const dashboardController = new DashboardController();
export default dashboardController;
