import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import env from './config/env.js';
import v1Routes from './routes/index.js';
import seoController from './modules/seo/seo.controller.js';
import notFound from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';

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

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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
