import apiClient from './api.js';

/**
 * @typedef {Object} Subject
 * @property {string} id
 * @property {string} courseId
 * @property {string} name
 * @property {string} slug
 * @property {string|null} description
 * @property {number} semester
 * @property {boolean} isActive
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * Service for fetching and interacting with Academic Subjects.
 */
export const subjectService = {
  /**
   * Fetches paginated subjects with optional course and semester filters.
   *
   * @param {{ page?: number, limit?: number, courseId?: string, semester?: number, isActive?: boolean }} [params]
   * @returns {Promise<{ items: Subject[], meta: any }>}
   */
  async listSubjects(params = {}) {
    const response = await apiClient.get('/subjects', { params });
    return response.data?.data;
  },

  /**
   * Fetches a single subject by ID.
   *
   * @param {string} id
   * @returns {Promise<Subject>}
   */
  async getSubjectById(id) {
    const response = await apiClient.get(`/subjects/${encodeURIComponent(id)}`);
    return response.data?.data;
  }
};

export default subjectService;
