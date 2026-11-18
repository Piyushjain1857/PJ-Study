import express from 'express';
import zlib from 'zlib';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import env from './config/env.js';
import v1Routes from './routes/index.js';
import seoController from './modules/seo/seo.controller.js';
import swaggerRoutes from './docs/swagger.routes.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';
import requestId from './middleware/requestId.js';
import prisma, { queryMetricsStorage } from './config/database.js';

// Ensure BigInt values serialize cleanly to JSON across all API endpoints
if (!BigInt.prototype.toJSON) {
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };
}

/**
 * Creates and configures the Express application.
 * Separation of app configuration from server listening allows easy testing.
 *
 * @returns {import('express').Application}
 */
export function createApp() {
  const app = express();

  // Disable technology leakage header
  app.disable('x-powered-by');

  // Correlate requests with structured Request IDs
  app.use(requestId);

  // High-resolution response timing & Database Server-Timing telemetry headers
  app.use((req, res, next) => {
    const start = process.hrtime.bigint();
    const metrics = { dbDurationMs: 0, queryCount: 0 };

    queryMetricsStorage.run(metrics, () => {
      const originalWriteHead = res.writeHead;
      res.writeHead = function (...args) {
        if (!res.headersSent) {
          const totalMs = (Number(process.hrtime.bigint() - start) / 1e6).toFixed(2);
          const dbMs = metrics.dbDurationMs.toFixed(2);
          res.setHeader('X-Response-Time', `${totalMs}ms`);
          res.setHeader('X-Database-Time', `${dbMs}ms`);
          res.setHeader(
            'Server-Timing',
            `total;dur=${totalMs}, db;dur=${dbMs};desc="${metrics.queryCount} queries"`
          );
        }
        return originalWriteHead.apply(this, args);
      };
      next();
    });
  });

  // Enable reverse proxy trust for correct client IP detection in rate limiting
  app.set('trust proxy', 1);

  // Extract allowed CORS origins (supports single origin or comma-separated origins)
  const configuredOrigins = (env.frontendUrl || '')
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const allowedRenderOrigins = [
    'https://pj-study.onrender.com',
    'https://pj-study-frontend.onrender.com'
  ];

  // Enterprise Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
          fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
          connectSrc: [
            "'self'",
            ...configuredOrigins,
            ...allowedRenderOrigins,
            'https://*.onrender.com',
            'http://localhost:5173',
            'http://localhost:5001'
          ],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'", 'blob:'],
          frameSrc: ["'none'"],
          upgradeInsecureRequests: env.isProduction ? [] : null
        }
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false,
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xContentTypeOptions: true,
      xFrameOptions: { action: 'deny' },
      strictTransportSecurity: env.isProduction
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || !env.isProduction) {
          return callback(null, true);
        }
        const normalizedOrigin = origin.replace(/\/+$/, '');
        let isOriginAllowed = false;

        try {
          const parsed = new URL(origin);
          isOriginAllowed =
            configuredOrigins.includes(normalizedOrigin) ||
            allowedRenderOrigins.includes(normalizedOrigin) ||
            parsed.hostname.endsWith('.onrender.com');
        } catch {
          isOriginAllowed = configuredOrigins.includes(normalizedOrigin);
        }

        if (isOriginAllowed) {
          return callback(null, true);
        }
        // Return null, false to reject origin cleanly without throwing 500 error
        return callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'X-Request-Id']
    })
  );

  // High-performance gzip response compression for JSON and text payloads >= 1KB
  app.use((req, res, next) => {
    const acceptEncoding = req.headers['accept-encoding'] || '';
    if (!acceptEncoding.includes('gzip')) return next();

    const originalSend = res.send;
    res.send = function (body) {
      if (
        res.headersSent ||
        res.getHeader('Content-Encoding') ||
        (res.statusCode >= 300 && res.statusCode < 400)
      ) {
        return originalSend.call(this, body);
      }

      const contentType = res.getHeader('Content-Type') || '';
      const isCompressible =
        typeof contentType === 'string' &&
        (contentType.includes('application/json') ||
          contentType.includes('text/html') ||
          contentType.includes('text/plain') ||
          contentType.includes('application/xml'));

      if (isCompressible && (typeof body === 'string' || Buffer.isBuffer(body))) {
        const payloadBuffer = typeof body === 'string' ? Buffer.from(body) : body;
        if (payloadBuffer.length >= 1024) {
          try {
            const compressed = zlib.gzipSync(payloadBuffer);
            res.setHeader('Content-Encoding', 'gzip');
            res.setHeader('Content-Length', compressed.length);
            res.removeHeader('ETag');
            return originalSend.call(this, compressed);
          } catch {
            return originalSend.call(this, body);
          }
        }
      }
      return originalSend.call(this, body);
    };
    next();
  });

  // Request logging (skips high-frequency uptime and crawler probes to conserve CPU and I/O)
  const isProbeRequest = (req) =>
    req.url.includes('/health') || req.url === '/robots.txt' || req.url === '/sitemap.xml';

  if (env.isDevelopment) {
    app.use(morgan('dev', { skip: isProbeRequest }));
  } else if (!env.isTest) {
    app.use(morgan('combined', { skip: isProbeRequest }));
  }

  // Cookie parsing middleware
  app.use(cookieParser());

  // Body parsing middleware with strict size bounds (prevent memory exhaustion DoS)
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Top-level crawler and discovery routes
  app.get('/sitemap.xml', seoController.getSitemapXml);
  app.get('/robots.txt', seoController.getRobotsTxt);

  // Top-level health check probe for load balancers and orchestrators
  app.get('/health', (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'healthy',
        product: 'PJ Study',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        environment: env.nodeEnv
      }
    });
  });

  // Liveness probe (process uptime check)
  app.get(['/health/live', '/live'], (req, res) => {
    res.status(200).json({
      success: true,
      status: 'alive',
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    });
  });

  // Readiness probe (verifies database connectivity with pure read-only ping)
  app.get(['/health/ready', '/ready'], async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return res.status(200).json({
        success: true,
        status: 'ready',
        database: 'connected',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      return res.status(503).json({
        success: false,
        status: 'degraded',
        database: 'disconnected',
        error: env.isProduction ? 'Database service unavailable' : err.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Swagger OpenAPI Documentation and Explorer
  app.use('/', swaggerRoutes);
  app.use('/api', swaggerRoutes);
  app.get(['/docs', '/docs/*', '/swagger', '/swagger/*'], (req, res) => res.redirect('/api-docs/'));
  app.get(['/api/swagger', '/api/swagger/*'], (req, res) => res.redirect('/api-docs/'));
  app.get(['/api/v1/docs', '/api/v1/swagger', '/api/v1/api-docs'], (req, res) => res.redirect('/api-docs/'));

  // API v1 router
  app.use('/api/v1', v1Routes);

  // Catch-all 404 handler for unmatched routes
  app.use(notFound);

  // Centralized error handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;
