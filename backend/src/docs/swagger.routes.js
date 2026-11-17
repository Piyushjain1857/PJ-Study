import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swaggerSpec.js';
import { customSwaggerCss } from './swagger.config.js';
import env from '../config/env.js';

const router = Router();

/**
 * Access control guard for Swagger UI and raw OpenAPI JSON spec.
 * - Always accessible in development and test environments.
 * - In production: Disabled by default (returns HTTP 403), unless explicitly enabled
 *   via ENABLE_SWAGGER=true or SWAGGER_ENABLED=true in environment configuration.
 * - Optional SWAGGER_KEY header/query support in production.
 */
export const checkDocsAccess = (req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production' || (env.isProduction && !env.isTest);
  if (!isProd) {
    return next();
  }

  const isEnabled = process.env.ENABLE_SWAGGER === 'true' || process.env.SWAGGER_ENABLED === 'true';
  if (!isEnabled) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'DOCS_DISABLED',
        message: 'Interactive API documentation is disabled in the production environment.',
        statusCode: 403
      }
    });
  }

  if (process.env.SWAGGER_KEY) {
    const providedKey = req.headers['x-swagger-key'] || req.query.key;
    if (providedKey !== process.env.SWAGGER_KEY) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED_DOCS_ACCESS',
          message: 'Valid documentation access key required in production.',
          statusCode: 401
        }
      });
    }
  }

  next();
};

const swaggerUiOptions = {
  customCss: customSwaggerCss,
  customSiteTitle: 'PJ Study — API Documentation & Explorer',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    validatorUrl: null
  }
};

// 1. Raw OpenAPI JSON spec endpoints
router.get(['/api-docs.json', '/docs.json'], checkDocsAccess, (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// 2. Interactive Swagger UI explorer endpoints
router.use(
  ['/api-docs', '/docs'],
  checkDocsAccess,
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, swaggerUiOptions)
);

// 3. User-friendly redirects for common aliases
router.get(['/swagger', '/swagger/*'], (req, res) => res.redirect('/api-docs/'));

export default router;
