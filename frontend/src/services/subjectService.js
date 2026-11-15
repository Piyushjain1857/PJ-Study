import apiClient from './api.js';

let cachedSubjects = null;
let cacheTimestamp = 0;
let inFlightSubjectsPromise = null;
const CACHE_TTL_MS = 30000; // 30 seconds

/**
 * Service for fetching and interacting with Academic Subjects.
 */
export const subjectService = {
  /**
   * Fetches subjects with optional filtering.
   * Always resolves to an array of Subject items for safe mapping.
   * Includes in-flight request deduplication and TTL caching.
   *
   * @param {{ page?: number, limit?: number, courseId?: string, semester?: number, isActive?: boolean }} [params]
   * @param {{ forceFresh?: boolean }} [options]
   * @returns {Promise<Array<any>>}
   */
  async listSubjects(params = {}, options = { forceFresh: false }) {
    const hasParams = Object.keys(params).length > 0;
    const now = Date.now();

    if (
      !hasParams &&
      !options.forceFresh &&
      cachedSubjects &&
      now - cacheTimestamp < CACHE_TTL_MS
    ) {
      return cachedSubjects;
    }

    if (!hasParams && inFlightSubjectsPromise && !options.forceFresh) {
      return inFlightSubjectsPromise;
    }

    const fetchPromise = (async () => {
      try {
        const response = await apiClient.get('/subjects', { params });
        const data = response.data?.data;
        let items = [];
        if (Array.isArray(data)) {
          items = data;
        } else if (data && Array.isArray(data.items)) {
          items = data.items;
        } else if (data && Array.isArray(data.data)) {
          items = data.data;
        }

        if (!hasParams) {
          cachedSubjects = items;
          cacheTimestamp = Date.now();
        }
        return items;
      } finally {
        if (!hasParams) {
          inFlightSubjectsPromise = null;
        }
      }
    })();

    if (!hasParams) {
      inFlightSubjectsPromise = fetchPromise;
    }

    return fetchPromise;
  },

  /**
   * Fetches full paginated envelope for administrative views.
   *
   * @param {object} [params]
   */
  async listSubjectsPaginated(params = {}) {
    const response = await apiClient.get('/subjects', { params });
    return response.data?.data;
  },

  /**
   * Fetches a single subject by ID.
   *
   * @param {string} id
   */
  async getSubjectById(id) {
    const response = await apiClient.get(`/subjects/${encodeURIComponent(id)}`);
    return response.data?.data;
  },

  /**
   * Clears in-memory subject cache.
   */
  clearCache() {
    cachedSubjects = null;
    cacheTimestamp = 0;
    inFlightSubjectsPromise = null;
  }
};

export default subjectService;
