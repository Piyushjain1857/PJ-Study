import apiClient from './api.js';

/**
 * Service for querying academic taxonomy categories.
 */
export const categoryService = {
  /**
   * Retrieves all active note categories.
   *
   * @returns {Promise<Array<{ id: string, name: string, slug: string, description: string }>>}
   */
  async listCategories() {
    const response = await apiClient.get('/categories');
    return response.data?.data || [];
  },

  /**
   * Retrieves single category by ID.
   *
   * @param {string} id
   */
  async getCategoryById(id) {
    const response = await apiClient.get(`/categories/${encodeURIComponent(id)}`);
    return response.data?.data;
  }
};

export default categoryService;

