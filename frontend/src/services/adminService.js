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
  },

  /**
   * Academic Taxonomy Management
   */
  async getAcademics() {
    const response = await apiClient.get('/admin/academics');
    return response.data?.data;
  },

  async createUniversity(data) {
    const response = await apiClient.post('/admin/academics/universities', data);
    return response.data?.data;
  },

  async updateUniversity(id, data) {
    const response = await apiClient.patch(`/admin/academics/universities/${id}`, data);
    return response.data?.data;
  },

  async deleteUniversity(id) {
    const response = await apiClient.delete(`/admin/academics/universities/${id}`);
    return response.data?.data;
  },

  async createSchool(data) {
    const response = await apiClient.post('/admin/academics/schools', data);
    return response.data?.data;
  },

  async updateSchool(id, data) {
    const response = await apiClient.patch(`/admin/academics/schools/${id}`, data);
    return response.data?.data;
  },

  async deleteSchool(id) {
    const response = await apiClient.delete(`/admin/academics/schools/${id}`);
    return response.data?.data;
  },

  async createCourse(data) {
    const response = await apiClient.post('/admin/academics/courses', data);
    return response.data?.data;
  },

  async updateCourse(id, data) {
    const response = await apiClient.patch(`/admin/academics/courses/${id}`, data);
    return response.data?.data;
  },

  async deleteCourse(id) {
    const response = await apiClient.delete(`/admin/academics/courses/${id}`);
    return response.data?.data;
  },

  async getCourseSemesters(id) {
    const response = await apiClient.get(`/admin/academics/courses/${id}/semesters`);
    return response.data?.data;
  },

  async createSubject(data) {
    const response = await apiClient.post('/admin/academics/subjects', data);
    return response.data?.data;
  },

  async updateSubject(id, data) {
    const response = await apiClient.patch(`/admin/academics/subjects/${id}`, data);
    return response.data?.data;
  },

  async deleteSubject(id) {
    const response = await apiClient.delete(`/admin/academics/subjects/${id}`);
    return response.data?.data;
  },

  async createCategory(data) {
    const response = await apiClient.post('/admin/academics/categories', data);
    return response.data?.data;
  },

  async updateCategory(id, data) {
    const response = await apiClient.patch(`/admin/academics/categories/${id}`, data);
    return response.data?.data;
  },

  async deleteCategory(id) {
    const response = await apiClient.delete(`/admin/academics/categories/${id}`);
    return response.data?.data;
  },

  /**
   * Complete Command Center Overview & Analytics
   */
  async getOverview() {
    const response = await apiClient.get('/admin/overview');
    return response.data?.data;
  },

  async getAnalytics(range = '30d') {
    const response = await apiClient.get('/admin/analytics', { params: { range } });
    return response.data?.data;
  },

  async getModerators(params = {}) {
    const response = await apiClient.get('/admin/moderators', { params });
    return response.data?.data;
  },

  async getNotes(params = {}) {
    const response = await apiClient.get('/admin/notes', { params });
    return response.data?.data;
  },

  async deleteNote(id, reason) {
    const response = await apiClient.delete(`/admin/notes/${id}`, { data: { reason } });
    return response.data?.data;
  },

  async publishNote(id) {
    const response = await apiClient.patch(`/notes/${id}/publish`);
    return response.data?.data;
  },

  async unpublishNote(id) {
    const response = await apiClient.patch(`/notes/${id}/unpublish`);
    return response.data?.data;
  },

  async reviewNote(id, decision, rejectionReason = '') {
    const response = await apiClient.post(`/notes/${id}/review`, { decision, rejectionReason });
    return response.data?.data;
  },

  async getReports(params = {}) {
    const response = await apiClient.get('/admin/reports', { params });
    return response.data?.data;
  },

  async resolveReport(id, action, reason = '') {
    const response = await apiClient.post(`/admin/reports/${id}/resolve`, { action, reason });
    return response.data?.data;
  },

  async getSettings() {
    const response = await apiClient.get('/admin/settings');
    return response.data?.data;
  },

  async updateSettings(settingsMap) {
    const response = await apiClient.patch('/admin/settings', settingsMap);
    return response.data?.data;
  },

  async getAnnouncements() {
    const response = await apiClient.get('/admin/announcements');
    return response.data?.data;
  },

  async createAnnouncement(data) {
    const response = await apiClient.post('/admin/announcements', data);
    return response.data?.data;
  },

  async getSystemHealth() {
    const response = await apiClient.get('/admin/health');
    return response.data?.data;
  },

  async getStorageStats() {
    const response = await apiClient.get('/admin/storage');
    return response.data?.data;
  },

  async getBackupStatus() {
    const response = await apiClient.get('/admin/backups');
    return response.data?.data;
  },

  async getLiveActivity(limit = 20) {
    const response = await apiClient.get('/admin/activity', { params: { limit } });
    return response.data?.data;
  },

  /**
   * Email Delivery Logs & Notification Templates
   */
  async getEmailDeliveryLogs(params = {}) {
    const response = await apiClient.get('/admin/email-logs', { params });
    return response.data?.data;
  },

  async getFailedEmailLogs(params = {}) {
    const response = await apiClient.get('/admin/email-logs/failed', { params });
    return response.data?.data;
  },

  async retryEmailDelivery(id) {
    const response = await apiClient.post(`/admin/email-logs/${id}/retry`);
    return response.data?.data;
  },

  async getNotificationTemplates() {
    const response = await apiClient.get('/admin/notification-templates');
    return response.data?.data;
  },

  async updateNotificationTemplate(key, data) {
    const response = await apiClient.put(`/admin/notification-templates/${key}`, data);
    return response.data?.data;
  },

  async broadcastEmail(data) {
    const response = await apiClient.post('/admin/broadcast-email', data);
    return response.data?.data;
  }
};

export default adminService;
