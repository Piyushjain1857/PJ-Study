/**
 * Middleware to handle unmatched routes (404 Not Found).
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export function notFound(req, res, next) {
  const error = new Error(`Resource not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = 'NOT_FOUND';
  next(error);
}

export default notFound;

