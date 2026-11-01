/**
 * Shared utilities, response formatters, and helper functions.
 */

/**
 * Standardizes API success responses.
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

