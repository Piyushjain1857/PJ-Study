import express from 'express';
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

  // Enable reverse proxy trust for correct client IP detection in rate limiting
  app.set('trust proxy', 1);

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
          connectSrc: ["'self'", env.frontendUrl, 'http://localhost:5173', 'http://localhost:5001'],
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
        const allowedOrigins = [env.frontendUrl];
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('CORS policy: origin not allowed by Access-Control-Allow-Origin.'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
    })
  );

  // Request logging
  if (env.isDevelopment) {
    app.use(morgan('dev'));
  } else if (!env.isTest) {
    app.use(morgan('combined'));
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
