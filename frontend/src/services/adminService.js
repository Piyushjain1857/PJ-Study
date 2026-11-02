import apiClient from './api.js';

/**
 * Frontend API client for Administrative and RBAC services.
 */
export const adminService = {
  /**
   * Retrieves paginated, filtered, and searchable user records.
   *
   * @param {{
   *   page?: number,
   *   limit?: number,
   *   search?: string,
   *   role?: string,
   *   status?: string,
   *   sortBy?: string,
   *   sortOrder?: string
   * }} params
   */
  async getUsers(params = {}) {
    const response = await apiClient.get('/admin/users', { params });
    return response.data?.data;
  },

  /**
   * Retrieves full details and activity statistics for a specific user.
   *
   * @param {string} id
   */
  async getUserById(id) {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response.data?.data;
  },

  /**
   * Updates basic user profile info or modifies account suspension.
   *
   * @param {string} id
   * @param {{ name?: string, bio?: string, isActive?: boolean, reason?: string }} data
   */
  async updateUser(id, data) {
    const response = await apiClient.patch(`/admin/users/${id}`, data);
    return response.data?.data;
  },

  /**
   * Modifies a user's role.
   *
   * @param {string} id
   * @param {string} role
   * @param {string} [reason]
   */
  async changeUserRole(id, role, reason) {
    const response = await apiClient.patch(`/admin/users/${id}/role`, { role, reason });
    return response.data?.data;
  },

  /**
   * Retrieves system roles and permission capability definitions.
   */
  async getRoles() {
    const response = await apiClient.get('/admin/roles');
    return response.data?.data;
  },

  /**
   * Retrieves paginated administrative audit logs.
   *
   * @param {{ page?: number, limit?: number, action?: string, entityType?: string, actorId?: string }} params
   */
  async getAuditLogs(params = {}) {
    const response = await apiClient.get('/admin/audit-logs', { params });
    return response.data?.data;
  },

  /**
   * Retrieves high-level user metrics.
   */
  async getStats() {
    const response = await apiClient.get('/admin/stats');
    return response.data?.data;
  }
};

export default adminService;

