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

  let message = err.message || 'An unexpected internal server error occurred';
  let code =
    err.code ||
    (statusCode === 400
      ? 'BAD_REQUEST'
      : statusCode === 401
      ? 'UNAUTHORIZED'
      : statusCode === 403
      ? 'FORBIDDEN'
      : statusCode === 404
      ? 'NOT_FOUND'
      : statusCode === 409
      ? 'CONFLICT'
      : statusCode === 422
      ? 'VALIDATION_ERROR'
      : 'INTERNAL_SERVER_ERROR');

  // Friendly interception for database connectivity issues (e.g. Prisma P1001)
  if (
    err.code === 'P1001' ||
    (typeof err.message === 'string' && err.message.includes("Can't reach database server"))
  ) {
    statusCode = 503;
    code = 'DATABASE_UNAVAILABLE';
    message = env.isProduction
      ? 'Database service is currently unavailable. Please try again shortly.'
      : 'Unable to connect to the MySQL database server. Please verify MySQL is running at localhost:3306.';
  }

  // Friendly interception for database authentication issues (e.g. Prisma P1000)
  if (
    err.code === 'P1000' ||
    (typeof err.message === 'string' &&
      err.message.includes('Authentication failed against database server'))
  ) {
    statusCode = 500;
    code = 'DATABASE_AUTH_FAILED';
    message = env.isProduction
      ? 'Database service is experiencing technical difficulties.'
      : 'Database authentication failed. Please verify the database credentials in backend/.env.';
  }

  // Intercept Prisma unique constraint violations (P2002)
  if (err.code === 'P2002') {
    statusCode = 409;
    code = 'DUPLICATE_RESOURCE';
    const fields = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field';
    message = `A resource with this ${fields} already exists.`;
  }

  // Intercept Prisma foreign key constraint failures (P2003)
  if (err.code === 'P2003') {
    statusCode = 400;
    code = 'FOREIGN_KEY_VIOLATION';
    message = 'Operation failed because related records depend on this resource.';
  }

  // Intercept Prisma record not found (P2025)
  if (err.code === 'P2025') {
    statusCode = 404;
    code = 'RECORD_NOT_FOUND';
    message = 'The requested database record was not found or has been removed.';
  }

  const response = {
    success: false,
    error: {
      message,
      code,
      statusCode,
      requestId: req.id || req.headers?.['x-request-id'] || undefined
    }
  };

  // Only expose stack trace and internal details in development mode
  if (env.isDevelopment) {
    response.error.stack = err.stack;
    if (err.details) {
      response.error.details = err.details;
    }
  }

  // Log server errors to stderr with structured correlation
  if (statusCode >= 500) {
    console.error(
      `[ERROR ${statusCode}] reqId=${req.id || '-'} ${req.method} ${req.originalUrl}:`,
      err
    );
  }

  res.status(statusCode).json(response);
}

export default errorHandler;
