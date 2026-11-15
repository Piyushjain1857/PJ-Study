import apiClient from './api.js';

// Cache configuration
const PROFILE_CACHE_TTL_MS = 15000; // 15 seconds fresh cache
let cachedProfileData = null;
let cachedProfileTimestamp = 0;
let profileInFlightPromise = null;

let cachedAcademicOptions = null;
let academicOptionsInFlightPromise = null;

let statsInFlightPromise = null;
let cachedStats = null;
let cachedStatsTimestamp = 0;

/**
 * Service managing personal Profile, academic identity, avatar uploads, and public contributor profiles.
 */
export const profileService = {
  /**
   * Invalidates local profile in-memory cache to force subsequent fresh fetch.
   */
  invalidateCache() {
    cachedProfileData = null;
    cachedProfileTimestamp = 0;
    cachedStats = null;
    cachedStatsTimestamp = 0;
  },

  /**
   * Retrieves current authenticated Profile with academic metadata and private statistics.
   * Features in-flight deduplication and short-lived caching to prevent repeated network bursts.
   *
   * @param {{ force?: boolean }} [options]
   */
  async getOwnProfile({ force = false } = {}) {
    const now = Date.now();
    if (!force && cachedProfileData && now - cachedProfileTimestamp < PROFILE_CACHE_TTL_MS) {
      return cachedProfileData;
    }

    if (profileInFlightPromise) {
      return profileInFlightPromise;
    }

    profileInFlightPromise = (async () => {
      try {
        const response = await apiClient.get('/profile/me');
        cachedProfileData = response.data?.data;
        cachedProfileTimestamp = Date.now();
        return cachedProfileData;
      } finally {
        profileInFlightPromise = null;
      }
    })();

    return profileInFlightPromise;
  },

  /**
   * Updates permitted personal and academic fields.
   *
   * @param {{
   *   name?: string,
   *   bio?: string,
   *   university?: string,
   *   courseId?: string,
   *   semester?: number
   * }} payload
   */
  async updateOwnProfile(payload) {
    this.invalidateCache();
    const response = await apiClient.patch('/profile/me', payload);
    const updated = response.data?.data;
    if (updated) {
      cachedProfileData = { ...(cachedProfileData || {}), ...updated };
      cachedProfileTimestamp = Date.now();
    }
    return updated;
  },

  /**
   * Uploads and sets a new avatar image.
   *
   * @param {File} file
   */
  async uploadAvatar(file) {
    this.invalidateCache();
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post('/profile/me/avatar', formData);
    const result = response.data?.data;
    if (result?.avatarUrl && cachedProfileData) {
      cachedProfileData.avatarUrl = result.avatarUrl;
      cachedProfileTimestamp = Date.now();
    }
    return result;
  },

  /**
   * Removes custom profile picture and resets to initials fallback.
   */
  async removeAvatar() {
    this.invalidateCache();
    const response = await apiClient.delete('/profile/me/avatar');
    const updated = response.data?.data;
    if (cachedProfileData) {
      cachedProfileData.avatarUrl = null;
      cachedProfileTimestamp = Date.now();
    }
    return updated;
  },

  /**
   * Updates scholar's privacy configuration toggles.
   *
   * @param {{
   *   publicProfileEnabled?: boolean,
   *   showAcademicInfo?: boolean,
   *   showBio?: boolean,
   *   showContributionStats?: boolean
   * }} payload
   */
  async updatePrivacySettings(payload) {
    this.invalidateCache();
    const response = await apiClient.patch('/profile/me/privacy', payload);
    const updated = response.data?.data;
    if (updated && cachedProfileData) {
      cachedProfileData = { ...cachedProfileData, ...updated };
      cachedProfileTimestamp = Date.now();
    }
    return updated;
  },

  /**
   * Retrieves paginated notes uploaded by the current scholar.
   *
   * @param {{ page?: number, limit?: number, status?: string, search?: string, sort?: string }} params
   */
  async getOwnUploads(params = {}) {
    const response = await apiClient.get('/profile/me/uploads', { params });
    return response.data?.data;
  },

  /**
   * Retrieves database-calculated contribution statistics for the current scholar.
   *
   * @param {{ force?: boolean }} [options]
   */
  async getOwnStats({ force = false } = {}) {
    const now = Date.now();
    if (!force && cachedStats && now - cachedStatsTimestamp < PROFILE_CACHE_TTL_MS) {
      return cachedStats;
    }

    if (statsInFlightPromise) {
      return statsInFlightPromise;
    }

    statsInFlightPromise = (async () => {
      try {
        const response = await apiClient.get('/profile/me/stats');
        cachedStats = response.data?.data;
        cachedStatsTimestamp = Date.now();
        return cachedStats;
      } finally {
        statsInFlightPromise = null;
      }
    })();

    return statsInFlightPromise;
  },

  /**
   * Retrieves active academic degree options (courses with valid semester lists).
   * Caches results in-memory since academic structure rarely changes within a session.
   *
   * @param {boolean} [force=false]
   */
  async getAcademicOptions(force = false) {
    if (!force && cachedAcademicOptions) {
      return cachedAcademicOptions;
    }

    if (academicOptionsInFlightPromise) {
      return academicOptionsInFlightPromise;
    }

    academicOptionsInFlightPromise = (async () => {
      try {
        const response = await apiClient.get('/profile/academic-options');
        cachedAcademicOptions = response.data?.data;
        return cachedAcademicOptions;
      } finally {
        academicOptionsInFlightPromise = null;
      }
    })();

    return academicOptionsInFlightPromise;
  },

  /**
   * Retrieves public contributor profile, respecting privacy controls.
   *
   * @param {string} userId
   */
  async getContributorProfile(userId) {
    const response = await apiClient.get(`/contributors/${userId}`);
    return response.data?.data;
  },

  /**
   * Retrieves approved public notes for a public contributor.
   *
   * @param {string} userId
   * @param {{ page?: number, limit?: number, sort?: string }} params
   */
  async getContributorNotes(userId, params = {}) {
    const response = await apiClient.get(`/contributors/${userId}/notes`, { params });
    return response.data?.data;
  }
};

export default profileService;
