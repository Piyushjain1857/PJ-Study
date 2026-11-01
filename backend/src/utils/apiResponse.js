/**
 * Standardized API response utilities.
 */

/**
 * Sends a standardized success response.
 *
 * @param {import('express').Response} res
 * @param {any} data
 * @param {number} [statusCode=200]
 * @param {string} [message]
 */
export function sendSuccess(res, data, statusCode = 200, message) {
  const payload = {
    success: true,
    data
  };
  if (message) {
    payload.message = message;
  }
  return res.status(statusCode).json(payload);
}

/**
 * Sends a standardized error response.
 *
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} [statusCode=400]
 * @param {string} [code='BAD_REQUEST']
 * @param {any} [errors]
 */
export function sendError(
  res,
  message,
  statusCode = 400,
  code = 'BAD_REQUEST',
  errors = undefined
) {
  const payload = {
    success: false,
    error: {
      message,
      code
    }
  };
  if (errors !== undefined) {
    payload.error.errors = errors;
  }
  return res.status(statusCode).json(payload);
}
