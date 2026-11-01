import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import env from './config/env.js';
import v1Routes from './routes/index.js';
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

  // Security headers
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: env.isProduction ? env.frontendUrl : true,
      credentials: true
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
