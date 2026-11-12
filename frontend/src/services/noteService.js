import apiClient from './api.js';

/**
 * Service for fetching notes, managing scholar manuscripts, file downloads, and moderation.
 */
export const noteService = {
  /**
   * Fetches published notes for the public library with search, pagination, and academic filters.
   *
   * @param {{
   *   page?: number,
   *   limit?: number,
   *   courseId?: string,
   *   subjectId?: string,
   *   categoryId?: string,
   *   semester?: number,
   *   academicYear?: string,
   *   search?: string,
   *   sortBy?: string
   * }} [params]
   * @returns {Promise<{ items: any[], meta: any }>}
   */
  async listNotes(params = {}) {
    const response = await apiClient.get('/notes', { params });
    return response.data?.data;
  },

  /**
   * Fetches single note details with draft isolation.
   *
   * @param {string} id
   * @returns {Promise<any>}
   */
  async getNoteById(id) {
    const response = await apiClient.get(`/notes/${encodeURIComponent(id)}`);
    return response.data?.data;
  },

  /**
   * Creates a new note (as DRAFT or PENDING review).
   * Supports both FormData (with file attachment) and plain JSON.
   *
   * @param {FormData | object} payload
   * @returns {Promise<any>}
   */
  async createNote(payload) {
    const isFormData = payload instanceof FormData;
    const response = await apiClient.post('/notes', payload, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
    return response.data?.data;
  },

  /**
   * Updates an existing note.
   *
   * @param {string} id
   * @param {FormData | object} payload
   * @returns {Promise<any>}
   */
  async updateNote(id, payload) {
    const isFormData = payload instanceof FormData;
    const response = await apiClient.patch(`/notes/${encodeURIComponent(id)}`, payload, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
    return response.data?.data;
  },

  /**
   * Deletes a note (owner of draft/rejected or administrator).
   *
   * @param {string} id
   * @returns {Promise<any>}
   */
  async deleteNote(id) {
    const response = await apiClient.delete(`/notes/${encodeURIComponent(id)}`);
    return response.data?.data;
  },

  /**
   * Submits a DRAFT or REJECTED note for moderation review.
   *
   * @param {string} id
   * @returns {Promise<any>}
   */
  async submitForReview(id) {
    const response = await apiClient.post(`/notes/${encodeURIComponent(id)}/submit`);
    return response.data?.data;
  },

  /**
   * Archives an approved note.
   *
   * @param {string} id
   * @returns {Promise<any>}
   */
  async archiveNote(id) {
    const response = await apiClient.post(`/notes/${encodeURIComponent(id)}/archive`);
    return response.data?.data;
  },

  /**
   * Reviews and approves or rejects a note submission (moderator/admin).
   *
   * @param {string} id
   * @param {{ status: 'APPROVED' | 'REJECTED', reason?: string }} data
   * @returns {Promise<any>}
   */
  async reviewNote(id, data) {
    const response = await apiClient.post(`/notes/${encodeURIComponent(id)}/review`, data);
    return response.data?.data;
  },

  /**
   * Fetches notes uploaded by the current scholar for the "My Notes" dashboard.
   *
   * @param {{
   *   page?: number,
   *   limit?: number,
   *   status?: string,
   *   search?: string
   * }} [params]
   * @returns {Promise<{ items: any[], meta: any }>}
   */
  async getMyNotes(params = {}) {
    const response = await apiClient.get('/users/me/notes', { params });
    return response.data?.data;
  },

  /**
   * Fetches pending notes in the moderation queue for academic staff.
   *
   * @param {{
   *   page?: number,
   *   limit?: number,
   *   search?: string
   * }} [params]
   * @returns {Promise<{ items: any[], meta: any }>}
   */
  async getModerationQueue(params = {}) {
    const response = await apiClient.get('/notes/moderation/queue', { params });
    return response.data?.data;
  },

  /**
   * Downloads a note's attached file document securely.
   *
   * @param {string} id
   * @param {string} [fileName='study-document']
   */
  async downloadFile(id, fileName = 'study-document') {
    const response = await apiClient.get(`/notes/${encodeURIComponent(id)}/file`, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Bookmarks a note.
   *
   * @param {string} noteId
   */
  async bookmarkNote(noteId) {
    const response = await apiClient.post(`/notes/${encodeURIComponent(noteId)}/bookmark`);
    return response.data?.data;
  },

  /**
   * Removes bookmark.
   *
   * @param {string} noteId
   */
  async removeBookmark(noteId) {
    const response = await apiClient.delete(`/notes/${encodeURIComponent(noteId)}/bookmark`);
    return response.data?.data;
  },

  /**
   * Submits peer rating and review.
   *
   * @param {string} noteId
   * @param {{ rating: number, comment?: string }} reviewData
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
