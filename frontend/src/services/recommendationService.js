import apiClient from './api.js';

/**
 * Service for fetching explainable, personalized recommendations and academic discovery feeds.
 */
export const recommendationService = {
  /**
   * Retrieves personalized recommendations for the authenticated student.
   *
   * @param {{ limit?: number }} [params={}]
   * @returns {Promise<{
   *   personalized: boolean,
   *   fallback: boolean,
   *   message?: string,
   *   matchedSignals?: { subjectsCount: number, coursesCount: number, primarySubjectId: string },
   *   recommendations: Array<{ note: object, score: number, reason: string, reasons?: string[] }>
   * }>}
   */
  async getPersonalizedRecommendations(params = {}) {
    const query = new URLSearchParams();
    if (params.limit) query.append('limit', params.limit);

    const queryString = query.toString();
    const url = `/recommendations/notes${queryString ? `?${queryString}` : ''}`;
    const response = await apiClient.get(url);
    return response.data?.data;
  },

  /**
   * Retrieves contextual similar notes for a target note.
   *
   * @param {string} noteId
   * @param {number} [limit=4]
   * @returns {Promise<{
   *   targetNoteId: string,
   *   similarNotes: Array<{ note: object, score: number, reason: string }>
   * }>}
   */
  async getSimilarNotes(noteId, limit = 4) {
    const response = await apiClient.get(`/recommendations/notes/similar/${noteId}?limit=${limit}`);
    return response.data?.data;
  },

  /**
   * Retrieves notes curated from the student's active subjects.
   *
   * @param {number} [limit=6]
   * @returns {Promise<{
   *   hasSubjects: boolean,
   *   recommendations: Array<{ note: object, reason: string }>
   * }>}
   */
  async getSubjectRecommendations(limit = 6) {
    const response = await apiClient.get(`/recommendations/notes/subjects?limit=${limit}`);
    return response.data?.data;
  },

  /**
   * Retrieves recently approved public notes.
   *
   * @param {number} [limit=6]
   * @returns {Promise<{
   *   recommendations: Array<{ note: object, reason: string }>
   * }>}
   */
  async getRecentRecommendations(limit = 6) {
    const response = await apiClient.get(`/recommendations/notes/recent?limit=${limit}`);
    return response.data?.data;
  },

  /**
   * Retrieves popular approved study notes.
   *
   * @param {number} [limit=6]
   * @returns {Promise<{
   *   recommendations: Array<{ note: object, reason: string }>
   * }>}
   */
  async getPopularRecommendations(limit = 6) {
    const response = await apiClient.get(`/recommendations/notes/popular?limit=${limit}`);
    return response.data?.data;
  }
};

export default recommendationService;
