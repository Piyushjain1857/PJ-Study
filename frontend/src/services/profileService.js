import apiClient from './api.js';

/**
 * Service managing personal scholar profile, academic identity, avatar uploads, and public contributor profiles.
 */
export const profileService = {
  /**
   * Retrieves current authenticated scholar profile with academic metadata and private statistics.
   */
  async getOwnProfile() {
    const response = await apiClient.get('/profile/me');
    return response.data?.data;
  },

  /**
   * Updates permitted personal and academic fields.
   *
   * @param {{
   *   name?: string,
   *   bio?: string,
   *   university?: string,
   *   courseId?: string,
   *   semester?: number
   * }} payload
   */
  async updateOwnProfile(payload) {
    const response = await apiClient.patch('/profile/me', payload);
    return response.data?.data;
  },

  /**
   * Uploads and sets a new avatar image.
   *
   * @param {File} file
   */
  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post('/profile/me/avatar', formData);
    return response.data?.data;
  },

  /**
   * Removes custom profile picture and resets to initials fallback.
   */
  async removeAvatar() {
    const response = await apiClient.delete('/profile/me/avatar');
    return response.data?.data;
  },

  /**
   * Updates scholar's privacy configuration toggles.
   *
   * @param {{
   *   publicProfileEnabled?: boolean,
   *   showAcademicInfo?: boolean,
   *   showBio?: boolean,
   *   showContributionStats?: boolean
   * }} payload
   */
  async updatePrivacySettings(payload) {
    const response = await apiClient.patch('/profile/me/privacy', payload);
    return response.data?.data;
  },

  /**
   * Retrieves paginated notes uploaded by the current scholar.
   *
   * @param {{ page?: number, limit?: number, status?: string, search?: string, sort?: string }} params
   */
  async getOwnUploads(params = {}) {
    const response = await apiClient.get('/profile/me/uploads', { params });
    return response.data?.data;
  },

  /**
   * Retrieves database-calculated contribution statistics for the current scholar.
   */
  async getOwnStats() {
    const response = await apiClient.get('/profile/me/stats');
    return response.data?.data;
  },

  /**
   * Retrieves active academic degree options (courses with valid semester lists).
   */
  async getAcademicOptions() {
    const response = await apiClient.get('/profile/academic-options');
    return response.data?.data;
  },

  /**
   * Retrieves public contributor profile, respecting privacy controls.
   *
   * @param {string} userId
   */
  async getContributorProfile(userId) {
    const response = await apiClient.get(`/contributors/${userId}`);
    return response.data?.data;
  },

  /**
   * Retrieves approved public notes for a public contributor.
   *
   * @param {string} userId
   * @param {{ page?: number, limit?: number, sort?: string }} params
   */
  async getContributorNotes(userId, params = {}) {
    const response = await apiClient.get(`/contributors/${userId}/notes`, { params });
    return response.data?.data;
  }
};

export default profileService;
