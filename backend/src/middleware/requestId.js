import crypto from 'crypto';

/**
 * Request ID tracking middleware.
 * Assigns or propagates a unique correlation ID across requests, responses, and loggers.
 * Helps trace client requests through microservices, proxies, and error reporting.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function requestId(req, res, next) {
  const existingId = req.headers['x-request-id'];
  const id =
    typeof existingId === 'string' && existingId.trim().length > 0 && existingId.length <= 128
      ? existingId.trim()
      : crypto.randomUUID();

  req.id = id;
  req.requestId = id;
  res.setHeader('X-Request-Id', id);

  next();
}

export default requestId;
