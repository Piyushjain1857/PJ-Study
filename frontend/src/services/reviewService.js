import apiClient from './api.js';

/**
 * Service handling Notes Ratings, Reviews, Helpful Votes, Reporting & Moderation.
 */
export const reviewService = {
  /**
   * Retrieves visible reviews for a note with pagination and sorting.
   *
   * @param {string} noteId
   * @param {{ page?: number, limit?: number, sort?: string }} [params={}]
   */
  async getNoteReviews(noteId, params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.sort) query.append('sort', params.sort);

    const queryString = query.toString();
    const url = `/notes/${encodeURIComponent(noteId)}/reviews${queryString ? `?${queryString}` : ''}`;
    const response = await apiClient.get(url);
    return response.data?.data;
  },

  /**
   * Retrieves rating summary and distribution for a note.
   *
   * @param {string} noteId
   * @returns {Promise<{
   *   averageRating: number,
   *   totalRatings: number,
   *   distribution: { 1: number, 2: number, 3: number, 4: number, 5: number }
   * }>}
   */
  async getRatingSummary(noteId) {
    const response = await apiClient.get(`/notes/${encodeURIComponent(noteId)}/rating-summary`);
    return response.data?.data;
  },

  /**
   * Submits a rating and optional review for an approved note.
   *
   * @param {string} noteId
   * @param {{ rating: number, comment?: string }} payload
   */
  async submitReview(noteId, payload) {
    const response = await apiClient.post(`/notes/${encodeURIComponent(noteId)}/reviews`, payload);
    return response.data?.data;
  },

  /**
   * Updates an existing review owned by the authenticated student.
   *
   * @param {string} noteId
   * @param {string} reviewId
   * @param {{ rating?: number, comment?: string }} payload
   */
  async updateReview(noteId, reviewId, payload) {
    const response = await apiClient.patch(
      `/notes/${encodeURIComponent(noteId)}/reviews/${encodeURIComponent(reviewId)}`,
      payload
    );
    return response.data?.data;
  },

  /**
   * Deletes a review owned by the student.
   *
   * @param {string} noteId
   * @param {string} reviewId
   */
  async deleteReview(noteId, reviewId) {
    const response = await apiClient.delete(
      `/notes/${encodeURIComponent(noteId)}/reviews/${encodeURIComponent(reviewId)}`
    );
    return response.data?.data;
  },

  /**
   * Marks a review as helpful.
   *
   * @param {string} reviewId
   */
  async voteHelpful(reviewId) {
    const response = await apiClient.put(`/reviews/${encodeURIComponent(reviewId)}/helpful`);
    return response.data?.data;
  },

  /**
   * Removes a helpful vote.
   *
   * @param {string} reviewId
   */
  async removeHelpfulVote(reviewId) {
    const response = await apiClient.delete(`/reviews/${encodeURIComponent(reviewId)}/helpful`);
    return response.data?.data;
  },

  /**
   * Reports an inappropriate review.
   *
   * @param {string} reviewId
   * @param {{ reason: string, description?: string }} payload
   */
  async reportReview(reviewId, payload) {
    const response = await apiClient.post(
      `/reviews/${encodeURIComponent(reviewId)}/reports`,
      payload
    );
    return response.data?.data;
  },

  // =========================================================================
  // ADMINISTRATIVE MODERATION
  // =========================================================================

  /**
   * Retrieves review reports for moderation dashboard.
   *
   * @param {{ page?: number, limit?: number, status?: string }} [params={}]
   */
  async getAdminReviewReports(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.status) query.append('status', params.status);

    const queryString = query.toString();
    const url = `/admin/reviews/reports${queryString ? `?${queryString}` : ''}`;
    const response = await apiClient.get(url);
    return response.data?.data;
  },

  /**
   * Hides an inappropriate review.
   *
   * @param {string} reviewId
   * @param {string} [reason]
   */
  async adminHideReview(reviewId, reason) {
    const response = await apiClient.post(`/admin/reviews/${encodeURIComponent(reviewId)}/hide`, {
      reason
    });
    return response.data?.data;
  },

  /**
   * Restores a previously hidden review.
   *
   * @param {string} reviewId
   */
  async adminRestoreReview(reviewId) {
    const response = await apiClient.post(`/admin/reviews/${encodeURIComponent(reviewId)}/restore`);
    return response.data?.data;
  },

  /**
   * Dismisses an invalid report on a review.
   *
   * @param {string} reportId
   */
  async adminDismissReport(reportId) {
    const response = await apiClient.post(
      `/admin/review-reports/${encodeURIComponent(reportId)}/dismiss`
    );
    return response.data?.data;
  }
};

export default reviewService;
