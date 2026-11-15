import apiClient from './api.js';

let cachedCourses = null;
let cacheTimestamp = 0;
let inFlightCoursesPromise = null;
const CACHE_TTL_MS = 30000; // 30 seconds

/**
 * Service for fetching and interacting with Academic Courses.
 */
export const courseService = {
  /**
   * Fetches courses with optional filtering.
   * Always resolves to an array of Course items for safe mapping.
   * Includes in-flight request deduplication and TTL caching.
   *
   * @param {{ page?: number, limit?: number, isActive?: boolean }} [params]
   * @param {{ forceFresh?: boolean }} [options]
   * @returns {Promise<Array<any>>}
   */
  async listCourses(params = {}, options = { forceFresh: false }) {
    const hasParams = Object.keys(params).length > 0;
    const now = Date.now();

    if (!hasParams && !options.forceFresh && cachedCourses && now - cacheTimestamp < CACHE_TTL_MS) {
      return cachedCourses;
    }

    if (!hasParams && inFlightCoursesPromise && !options.forceFresh) {
      return inFlightCoursesPromise;
    }

    const fetchPromise = (async () => {
      try {
        const response = await apiClient.get('/courses', { params });
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
          cachedCourses = items;
          cacheTimestamp = Date.now();
        }
        return items;
      } finally {
        if (!hasParams) {
          inFlightCoursesPromise = null;
        }
      }
    })();

    if (!hasParams) {
      inFlightCoursesPromise = fetchPromise;
    }

    return fetchPromise;
  },

  /**
   * Fetches full paginated envelope for administrative views.
   *
   * @param {object} [params]
   */
  async listCoursesPaginated(params = {}) {
    const response = await apiClient.get('/courses', { params });
    return response.data?.data;
  },

  /**
   * Fetches a single course by slug.
   *
   * @param {string} slug
   */
  async getCourseBySlug(slug) {
    const response = await apiClient.get(`/courses/slug/${encodeURIComponent(slug)}`);
    return response.data?.data;
  },

  /**
   * Fetches course details by ID.
   *
   * @param {string} id
   */
  async getCourseById(id) {
    const response = await apiClient.get(`/courses/${encodeURIComponent(id)}`);
    return response.data?.data;
  },

  /**
   * Clears in-memory course cache.
   */
  clearCache() {
    cachedCourses = null;
    cacheTimestamp = 0;
    inFlightCoursesPromise = null;
  }
};

export default courseService;
