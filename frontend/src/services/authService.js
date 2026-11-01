import apiClient, { setAccessToken } from './api.js';

/**
 * Frontend authentication API service for PJ Study.
 */
export const authService = {
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
    const { user, accessToken } = response.data?.data || {};
    if (accessToken) {
      setAccessToken(accessToken);
    }
    return { user, accessToken };
  },

  /**
   * Refreshes the active session via HttpOnly cookie.
   */
  async refresh() {
    const response = await apiClient.post('/auth/refresh');
    const { user, accessToken } = response.data?.data || {};
    if (accessToken) {
      setAccessToken(accessToken);
    }
    return { user, accessToken };
  },

  /**
   * Logs out the user and clears in-memory tokens and server cookies.
   */
  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setAccessToken(null);
    }
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
