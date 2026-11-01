/**
 * Shared utilities, response formatters, and helper functions.
 */

export * from './apiResponse.js';
export * from './password.js';
export * from './pagination.js';

/**
 * Standardizes API success responses (legacy helper kept for backward compatibility).
 *
 * @param {any} data - Payload data
 * @param {string} [message] - Optional descriptive message
 * @returns {{ success: true, data: any, message?: string }}
 */
export function formatSuccessResponse(data, message) {
  const response = { success: true, data };
  if (message) {
    response.message = message;
  }
  return response;
}
