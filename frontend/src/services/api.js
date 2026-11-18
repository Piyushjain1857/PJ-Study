import axios from 'axios';

/**
 * Resolves the appropriate base API URL across local development, custom domains,
 * and Render production deployments (avoiding localhost fallbacks on production).
 */
export function getRuntimeApiBaseUrl() {
  if (typeof window !== 'undefined') {
    const { hostname, protocol } = window.location;
    // Auto-link to deployed Render backend if running on Render static hosting
    if (hostname.includes('onrender.com')) {
      return 'https://pj-study-backend.onrender.com/api/v1';
    }
    // Custom domain production fallback
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const configured = import.meta.env.VITE_API_BASE_URL;
      if (configured && !configured.includes('localhost') && !configured.includes('127.0.0.1')) {
        return configured;
      }
      return `${protocol}//${hostname}/api/v1`;
    }
  }
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';
}

/**
 * Base URL for API requests.
 */
export const API_BASE_URL = getRuntimeApiBaseUrl();

/**
 * In-memory storage for short-lived access token.
 * Keeping it in memory rather than localStorage mitigates token exfiltration via XSS.
 */
let inMemoryAccessToken = null;
let isRefreshing = false;
let failedQueue = [];

/**
 * Sets the active in-memory access token.
 *
 * @param {string|null} token
 */
export function setAccessToken(token) {
  inMemoryAccessToken = token;
}

/**
 * Retrieves the current in-memory access token.
 *
 * @returns {string|null}
 */
export function getAccessToken() {
  return inMemoryAccessToken;
}

/**
 * Processes queued requests after a token refresh attempt finishes.
 *
 * @param {Error|null} error
 * @param {string|null} token
 */
function processQueue(error, token = null) {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
}

/**
 * Centralized Axios instance with credentials support and standard headers.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000, // 45 seconds to accommodate cloud web service cold starts
  withCredentials: true, // Send HttpOnly refresh cookies
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

// Request interceptor: injects in-memory JWT bearer token if available
apiClient.interceptors.request.use(
  (config) => {
    config.baseURL = getRuntimeApiBaseUrl();
    if (inMemoryAccessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
    // If sending FormData, remove Content-Type so browser sets boundary automatically
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handles 401s with silent refresh token rotation
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const statusCode = error.response?.status;
    const errorUrl = originalRequest?.url || '';

    // If 401 from refresh endpoint itself or auth login/register, don't attempt loop
    const isAuthEndpoint =
      errorUrl.includes('/auth/login') ||
      errorUrl.includes('/auth/refresh') ||
      errorUrl.includes('/auth/register');

    if (statusCode === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const fallbackToken =
          typeof window !== 'undefined'
            ? window.localStorage?.getItem('pj_study_refresh_token')
            : null;

        const activeBase = getRuntimeApiBaseUrl();
        const refreshResponse = await axios.post(
          `${activeBase}/auth/refresh`,
          fallbackToken ? { refreshToken: fallbackToken } : {},
          { withCredentials: true, timeout: 45000 }
        );

        const newAccessToken = refreshResponse.data?.data?.accessToken;
        const newRefreshToken = refreshResponse.data?.data?.refreshToken;
        if (newRefreshToken && typeof window !== 'undefined') {
          window.localStorage?.setItem('pj_study_refresh_token', newRefreshToken);
        }

        setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setAccessToken(null);
        if (typeof window !== 'undefined') {
          window.localStorage?.removeItem('pj_study_refresh_token');
        }
        return Promise.reject(formatAxiosError(error));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(formatAxiosError(error));
  }
);

/**
 * Detects whether an error originated from an aborted or intentionally canceled request.
 * Useful to prevent flashing alarming error banners on rapid filter updates or unmounting.
 *
 * @param {any} error
 * @returns {boolean}
 */
export function isCancellation(error) {
  if (!error) return false;
  return Boolean(
    error.isCanceled ||
      error.name === 'CanceledError' ||
      error.name === 'AbortError' ||
      error.code === 'ERR_CANCELED' ||
      error.message === 'canceled' ||
      error.message === 'Request canceled' ||
      axios.isCancel(error)
  );
}

/**
 * Extracts and formats errors consistently.
 */
function formatAxiosError(error) {
  const isCanceled = isCancellation(error);

  const data = error.response?.data;
  return {
    name: isCanceled ? 'CanceledError' : error?.name || 'Error',
    isCanceled,
    message: isCanceled
      ? 'Request canceled'
      : data?.error?.message || data?.message || error?.message || 'An unexpected error occurred',
    code: isCanceled ? 'ERR_CANCELED' : data?.error?.code || 'UNKNOWN_ERROR',
    statusCode: error.response?.status || (isCanceled ? 499 : 500),
    errors: data?.error?.errors || null
  };
}

/**
 * Checks backend API health status.
 */
export async function getHealthStatus() {
  const response = await apiClient.get('/health');
  return response.data?.data;
}

/**
 * Retrieves public platform configuration and features status.
 */
export async function getPlatformConfig() {
  const response = await apiClient.get('/config');
  return response.data?.data;
}

export default apiClient;
