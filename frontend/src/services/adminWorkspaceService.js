import apiClient from './api.js';

export const adminWorkspaceService = {
  /**
   * Retrieves scoped Admin dashboard overview metrics and recent activity.
   */
  async getOverview() {
    const response = await apiClient.get('/admin-workspace/overview');
    return response.data?.data;
  },

  /**
   * Retrieves scoped Admin analytics.
   */
  async getAnalytics() {
    const response = await apiClient.get('/admin-workspace/analytics');
    return response.data?.data;
  },

  /**
   * Retrieves the moderation queue.
   */
  async getQueue(params = {}) {
    const response = await apiClient.get('/admin-workspace/queue', { params });
    return response.data?.data;
  },

  /**
   * Retrieves content reports.
   */
  async getReports(params = {}) {
    const response = await apiClient.get('/admin-workspace/reports', { params });
    return response.data?.data;
  },

  /**
   * Retrieves moderation history.
   */
  async getHistory(params = {}) {
    const response = await apiClient.get('/admin-workspace/history', { params });
    return response.data?.data;
  },

  /**
   * Evaluates a manuscript submission (Approve / Reject).
   */
  async reviewNote(noteId, decision, rejectionReason = '') {
    const response = await apiClient.post(`/notes/${noteId}/review`, {
      decision,
      status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      rejectionReason,
      reason: rejectionReason
    });
    return response.data?.data;
  }
};

export default adminWorkspaceService;
