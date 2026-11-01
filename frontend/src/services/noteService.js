import apiClient from './api.js';

/**
 * @typedef {Object} Note
 * @property {string} id
 * @property {string} title
 * @property {string|null} description
 * @property {string} fileName
 * @property {string} storageKey
 * @property {number|string} fileSize
 * @property {string} mimeType
 * @property {number|null} pageCount
 * @property {string} courseId
 * @property {string} subjectId
 * @property {string|null} topicId
 * @property {string} uploadedById
 * @property {'DRAFT'|'PENDING_REVIEW'|'APPROVED'|'REJECTED'|'ARCHIVED'} status
 * @property {number} downloadCount
 * @property {number} viewCount
 * @property {string} createdAt
 * @property {string} updatedAt
 * @property {string|null} publishedAt
 */

/**
 * Service for fetching notes, managing student bookmarks, and submitting reviews.
 */
export const noteService = {
  /**
   * Fetches published notes with search, pagination, and academic filters.
   *
   * @param {{
   *   page?: number,
   *   limit?: number,
   *   courseId?: string,
   *   subjectId?: string,
   *   topicId?: string,
   *   search?: string
   * }} [params]
   * @returns {Promise<{ items: Note[], meta: any }>}
   */
  async listNotes(params = {}) {
    const response = await apiClient.get('/notes', { params });
    return response.data?.data;
  },

  /**
   * Fetches single note details.
   *
   * @param {string} id
   * @returns {Promise<Note>}
   */
  async getNoteById(id) {
    const response = await apiClient.get(`/notes/${encodeURIComponent(id)}`);
    return response.data?.data;
  },

  /**
   * Bookmarks a note to the user's personal study library.
   *
   * @param {string} noteId
   * @returns {Promise<{ bookmarked: boolean, message: string }>}
   */
  async bookmarkNote(noteId) {
    const response = await apiClient.post(`/notes/${encodeURIComponent(noteId)}/bookmark`);
    return response.data?.data;
  },

  /**
   * Removes a note from bookmarks.
   *
   * @param {string} noteId
   * @returns {Promise<{ bookmarked: boolean, message: string }>}
   */
  async removeBookmark(noteId) {
    const response = await apiClient.delete(`/notes/${encodeURIComponent(noteId)}/bookmark`);
    return response.data?.data;
  },

  /**
   * Submits a rating (1-5) and critique for an academic note.
   *
   * @param {string} noteId
   * @param {{ rating: number, comment?: string }} reviewData
   * @returns {Promise<any>}
   */
  async submitReview(noteId, reviewData) {
    const response = await apiClient.post(
      `/notes/${encodeURIComponent(noteId)}/reviews`,
      reviewData
    );
    return response.data?.data;
  }
};

export default noteService;
