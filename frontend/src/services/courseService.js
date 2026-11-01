import apiClient from './api.js';

/**
 * @typedef {Object} Course
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {string|null} description
 * @property {boolean} isActive
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * Service for fetching and interacting with Academic Courses.
 */
export const courseService = {
  /**
   * Fetches paginated courses.
   *
   * @param {{ page?: number, limit?: number, isActive?: boolean }} [params]
   * @returns {Promise<{ items: Course[], meta: any }>}
   */
  async listCourses(params = {}) {
    const response = await apiClient.get('/courses', { params });
    return response.data?.data;
  },

  /**
   * Fetches a single course by its URL slug.
   *
   * @param {string} slug
   * @returns {Promise<Course>}
   */
  async getCourseBySlug(slug) {
    const response = await apiClient.get(`/courses/slug/${encodeURIComponent(slug)}`);
    return response.data?.data;
  },

  /**
   * Fetches course details by ID.
   *
   * @param {string} id
   * @returns {Promise<Course>}
   */
  async getCourseById(id) {
    const response = await apiClient.get(`/courses/${encodeURIComponent(id)}`);
    return response.data?.data;
  }
};

export default courseService;
