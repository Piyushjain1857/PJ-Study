import axios from 'axios';

/**
 * Base URL for API requests.
 * Defaults to localhost backend if not explicitly defined in environment.
 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * Centralized Axios instance with timeout and standard headers.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

// Request interceptor for logging or auth token injection
apiClient.interceptors.request.use(
  (config) => {
    // In future steps, auth tokens from localStorage/cookies will be attached here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for consistent error extraction
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const formattedError = {
      message: error.response?.data?.error?.message || error.message || 'Network error occurred',
      statusCode: error.response?.status || 500,
      data: error.response?.data || null
    };
    return Promise.reject(formattedError);
  }
);

/**
 * Checks backend API health status.
 *
 * @returns {Promise<{
 *   status: string,
 *   product: string,
 *   tagline: string,
 *   version: string,
 *   timestamp: string,
 *   uptimeSeconds: number,
 *   environment: string
 * }>}
 */
export async function getHealthStatus() {
  const response = await apiClient.get('/health');
  return response.data?.data;
}

export default apiClient;

