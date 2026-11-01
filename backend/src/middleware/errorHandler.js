import env from '../config/env.js';

/**
 * Centralized error-handling middleware.
 * Formats errors into a consistent, predictable JSON structure.
 *
 * @param {Error} err - Error object
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} _next - Express next function (unused)
 */
export function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || res.statusCode;
  if (!statusCode || statusCode === 200) {
    statusCode = 500;
  }

  const response = {
    success: false,
    error: {
      message: err.message || 'An unexpected internal server error occurred',
      code: err.code || (statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR'),
      statusCode
    }
  };

  // Only expose stack trace and internal details in development mode
  if (env.isDevelopment) {
    response.error.stack = err.stack;
    if (err.details) {
      response.error.details = err.details;
    }
  }

  // Log server errors to stderr
  if (statusCode >= 500) {
    console.error(`[ERROR ${statusCode}] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json(response);
}

export default errorHandler;
