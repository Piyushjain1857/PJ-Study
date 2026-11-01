import apiClient from './api.js';

/**
 * @typedef {Object} Topic
 * @property {string} id
 * @property {string} subjectId
 * @property {string} name
 * @property {string} slug
 * @property {string|null} description
 * @property {string} createdAt
 * @property {string} updatedAt
 */

/**
 * Service for fetching syllabus topics.
 */
export const topicService = {
  /**
   * Fetches topics for a specific subject.
   *
   * @param {{ page?: number, limit?: number, subjectId?: string }} [params]
   * @returns {Promise<{ items: Topic[], meta: any }>}
   */
  async listTopics(params = {}) {
    const response = await apiClient.get('/topics', { params });
    return response.data?.data;
  },

  /**
   * Fetches a topic by ID.
   *
   * @param {string} id
   * @returns {Promise<Topic>}
   */
  async getTopicById(id) {
    const response = await apiClient.get(`/topics/${encodeURIComponent(id)}`);
    return response.data?.data;
  }
};

export default topicService;

