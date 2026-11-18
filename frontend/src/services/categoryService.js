import apiClient from './api.js';

let cachedCategories = null;
let cacheTimestamp = 0;
let inFlightCategoriesPromise = null;
const CACHE_TTL_MS = 60000; // 60 seconds

/**
 * Service for querying academic taxonomy categories.
 */
export const categoryService = {
  /**
   * Retrieves all active note categories with in-flight deduplication and short memory cache.
   *
   * @param {{ forceFresh?: boolean }} [options]
   * @returns {Promise<Array<{ id: string, name: string, slug: string, description: string }>>}
   */
  async listCategories(options = { forceFresh: false }) {
    const now = Date.now();
    if (!options.forceFresh && cachedCategories && now - cacheTimestamp < CACHE_TTL_MS) {
      return cachedCategories;
    }

    if (!options.forceFresh && inFlightCategoriesPromise) {
      return inFlightCategoriesPromise;
    }

    inFlightCategoriesPromise = apiClient
      .get('/categories')
      .then((res) => {
        const items = res.data?.data || [];
        cachedCategories = items;
        cacheTimestamp = Date.now();
        return items;
      })
      .finally(() => {
        inFlightCategoriesPromise = null;
      });

    return inFlightCategoriesPromise;
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
