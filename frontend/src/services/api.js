import axios from 'axios';

/**
 * Base URL for API requests.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';

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
  timeout: 15000,
  withCredentials: true, // Send HttpOnly refresh cookies
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

// Request interceptor: injects in-memory JWT bearer token if available
apiClient.interceptors.request.use(
  (config) => {
    if (inMemoryAccessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
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
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = refreshResponse.data?.data?.accessToken;
        setAccessToken(newAccessToken);
        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        setAccessToken(null);
        return Promise.reject(formatAxiosError(error));
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(formatAxiosError(error));
  }
);

/**
 * Extracts and formats errors consistently.
 */
function formatAxiosError(error) {
  const data = error.response?.data;
  return {
    message:
      data?.error?.message || data?.message || error.message || 'An unexpected error occurred',
    code: data?.error?.code || 'UNKNOWN_ERROR',
    statusCode: error.response?.status || 500,
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
