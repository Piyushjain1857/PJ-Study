import { apiClient } from './api.js';

export const dashboardService = {
  /**
   * Retrieves full overview statistics, recent notes, collections, downloads, and recommendations.
   *
   * @returns {Promise<any>}
   */
  async getOverview() {
    const response = await apiClient.get('/dashboard/overview');
    return response.data.data;
  },

  /**
   * Retrieves aggregated activity analytics timeline for the requested date range.
   *
   * @param {'7d' | '30d' | '90d'} range
   * @returns {Promise<any>}
   */
  async getAnalytics(range = '7d') {
    const response = await apiClient.get('/dashboard/analytics', {
      params: { range }
    });
    return response.data.data;
  },

  /**
   * Retrieves paginated download history for the student.
   *
   * @param {number} page
   * @param {number} limit
   * @returns {Promise<any>}
   */
  async getDownloads(page = 1, limit = 10) {
    const response = await apiClient.get('/dashboard/downloads', {
      params: { page, limit }
    });
    return response.data.data;
  }
};

export default dashboardService;
