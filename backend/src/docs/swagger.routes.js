import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swaggerSpec.js';

const router = Router();

// Custom branding CSS for Swagger UI to match PJ Study's editorial green design palette
const customCss = `
  .swagger-ui .topbar {
    background-color: #173d2f !important;
    border-bottom: 2px solid #245c46;
  }
  .swagger-ui .topbar .topbar-wrapper a span {
    color: #ffffff;
    font-weight: 700;
    font-size: 1.15rem;
    letter-spacing: -0.01em;
  }
  .swagger-ui .topbar .topbar-wrapper a::before {
    content: "📚 ";
    font-size: 1.2rem;
  }
  .swagger-ui .info h2.title {
    color: #173d2f;
    font-family: inherit;
  }
  .swagger-ui .btn.authorize {
    background-color: #245c46 !important;
    border-color: #245c46 !important;
    color: #ffffff !important;
  }
  .swagger-ui .btn.authorize svg {
    fill: #ffffff !important;
  }
  .swagger-ui .opblock.opblock-post .opblock-summary-method {
    background: #245c46 !important;
  }
  .swagger-ui .opblock.opblock-get .opblock-summary-method {
    background: #0284c7 !important;
  }
`;

const swaggerUiOptions = {
  customCss,
  customSiteTitle: 'PJ Study — API Documentation & Explorer',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    validatorUrl: null
  }
};

// Raw OpenAPI JSON spec endpoint
router.get('/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Interactive Swagger UI documentation explorer
router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
router.get('/swagger', (req, res) => res.redirect('/api/docs/'));
router.get('/swagger/*', (req, res) => res.redirect('/api/docs/'));

export default router;
