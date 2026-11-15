import apiClient from './api.js';

/**
 * Frontend API client for Notifications and Activity Center (Step 14).
 */
export const notificationService = {
  /**
   * Retrieves paginated, filtered notifications for the authenticated user.
   *
   * @param {{
   *   page?: number,
   *   limit?: number,
   *   status?: 'all' | 'unread' | 'read',
   *   category?: 'ACADEMIC' | 'REVIEWS' | 'COMMUNITY' | 'SYSTEM' | 'SECURITY'
   * }} params
   */
  async getNotifications(params = {}) {
    const response = await apiClient.get('/notifications', { params });
    return response.data?.data;
  },

  /**
   * Retrieves current unread notification count.
   */
  async getUnreadCount() {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data?.data;
  },

  /**
   * Marks a single notification as read.
   *
   * @param {string} notificationId
   */
  async markAsRead(notificationId) {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data?.data;
  },

  /**
   * Marks all notifications as read for current user.
   */
  async markAllAsRead() {
    const response = await apiClient.patch('/notifications/read-all');
    return response.data?.data;
  },

  /**
   * Dismisses / deletes a notification permanently.
   *
   * @param {string} notificationId
   */
  async dismissNotification(notificationId) {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data?.data;
  },

  /**
   * Retrieves notification delivery preferences.
   */
  async getPreferences() {
    const response = await apiClient.get('/notifications/preferences');
    return response.data?.data;
  },

  /**
   * Updates notification delivery preferences.
   *
   * @param {{
   *   noteModeration?: boolean,
   *   reviewActivity?: boolean,
   *   helpfulVotes?: boolean,
   *   platformAnnouncements?: boolean,
   *   inAppEnabled?: boolean
   * }} preferences
   */
  async updatePreferences(preferences) {
    const response = await apiClient.patch('/notifications/preferences', preferences);
    return response.data?.data;
  },

  /**
   * Admin/SuperAdmin broadcast announcement creation.
   *
   * @param {{
   *   title: string,
   *   message: string,
   *   targetAudience?: 'ALL' | 'STUDENT' | 'MODERATOR',
   *   targetUrl?: string,
   *   priority?: 'INFO' | 'IMPORTANT' | 'URGENT',
   *   expiresAt?: string
   * }} announcementData
   */
  async createAnnouncement(announcementData) {
    const response = await apiClient.post('/admin/announcements', announcementData);
    return response.data?.data;
  },

  /**
   * Admin/SuperAdmin retrieval of past announcements.
   *
   * @param {{ page?: number, limit?: number }} params
   */
  async getAnnouncements(params = {}) {
    const response = await apiClient.get('/admin/announcements', { params });
    return response.data?.data;
  }
};

export default notificationService;
