import apiClient, { setAccessToken } from './api.js';

const REFRESH_TOKEN_STORAGE_KEY = 'pj_study_refresh_token';

/**
 * Safely accesses stored refresh token for cross-origin third-party cookie fallback.
 */
export function getStoredRefreshToken() {
  try {
    return typeof window !== 'undefined' ? window.localStorage?.getItem(REFRESH_TOKEN_STORAGE_KEY) : null;
  } catch {
    return null;
  }
}

/**
 * Stores refresh token securely for resilient cross-site session restoration.
 */
export function setStoredRefreshToken(token) {
  try {
    if (typeof window === 'undefined') return;
    if (token) {
      window.localStorage?.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
    } else {
      window.localStorage?.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota or access errors
  }
}

/**
 * Removes stored refresh token.
 */
export function clearStoredRefreshToken() {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage?.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore
  }
}

/**
 * Frontend authentication API service for PJ Study.
 */
export const authService = {
  getStoredRefreshToken,
  setStoredRefreshToken,
  clearStoredRefreshToken,

  /**
   * Registers a new student account.
   *
   * @param {{ name: string, email: string, password: string }} payload
   */
  async register(payload) {
    const response = await apiClient.post('/auth/register', payload);
    return response.data;
  },

  /**
   * Authenticates user credentials and stores access token in memory.
   *
   * @param {{ email: string, password: string }} payload
   */
  async login(payload) {
    const response = await apiClient.post('/auth/login', payload);
    const { user, accessToken, refreshToken } = response.data?.data || {};
    if (accessToken) {
      setAccessToken(accessToken);
    }
    if (refreshToken) {
      setStoredRefreshToken(refreshToken);
    }
    return { user, accessToken, refreshToken };
  },

  /**
   * Refreshes the active session via HttpOnly cookie with fallback token body.
   */
  async refresh() {
    const fallbackToken = getStoredRefreshToken();
    const payload = fallbackToken ? { refreshToken: fallbackToken } : {};
    const response = await apiClient.post('/auth/refresh', payload);
    const { user, accessToken, refreshToken } = response.data?.data || {};
    if (accessToken) {
      setAccessToken(accessToken);
    }
    if (refreshToken) {
      setStoredRefreshToken(refreshToken);
    }
    return { user, accessToken, refreshToken };
  },

  /**
   * Logs out the user and clears in-memory tokens, storage tokens, and server cookies.
   */
  async logout() {
    try {
      const fallbackToken = getStoredRefreshToken();
      await apiClient.post('/auth/logout', fallbackToken ? { refreshToken: fallbackToken } : {});
    } finally {
      setAccessToken(null);
      clearStoredRefreshToken();
    }
  },

  /**
   * Directly verifies email for currently authenticated user session.
   */
  async verifyMe() {
    const response = await apiClient.post('/auth/verify-me');
    return response.data;
  },

  /**
   * Verifies account email address.
   *
   * @param {string} token
   */
  async verifyEmail(token) {
    const response = await apiClient.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
    return response.data;
  },

  /**
   * Dispatches a fresh verification link.
   *
   * @param {string} email
   */
  async resendVerification(email) {
    const response = await apiClient.post('/auth/resend-verification', { email });
    return response.data;
  },

  /**
   * Requests a password reset link.
   *
   * @param {string} email
   */
  async forgotPassword(email) {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Resets password using token.
   *
   * @param {{ token: string, password: string }} payload
   */
  async resetPassword(payload) {
    const response = await apiClient.post('/auth/reset-password', payload);
    return response.data;
  },

  /**
   * Changes password for authenticated user.
   *
   * @param {{ currentPassword: string, newPassword: string }} payload
   */
  async changePassword(payload) {
    const response = await apiClient.post('/auth/change-password', payload);
    return response.data;
  },

  /**
   * Retrieves profile details for currently authenticated user.
   */
  async getMe() {
    const response = await apiClient.get('/auth/me');
    return response.data?.data;
  }
};

export default authService;
