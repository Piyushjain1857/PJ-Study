/**
 * PJ Study OpenAPI 3.0.3 Configuration & UI Customization
 */
export const swaggerConfig = {
  openapi: '3.0.3',
  info: {
    title: 'PJ Study — Academic Notes & Curated Learning Platform API',
    version: '1.0.0',
    description:
      '### Official REST API & Developer Explorer for PJ Study\n\n' +
      'PJ Study provides an academic notes ecosystem connecting scholars, faculty reviewers, and campus administrators.\n\n' +
      '#### Supported Modules\n' +
      '- **Authentication & Sessions**: Registration, email verification, JWT Bearer tokens, password recovery.\n' +
      '- **Notes & Manuscripts**: Faceted search, full-text exploration, inline PDF reader streams, and direct downloads.\n' +
      '- **Curriculum Taxonomy**: Multi-tenant universities, schools, degree courses, dynamic semesters, and subjects.\n' +
      '- **Personalized Workspace**: Enrolled curriculum, reading history, saved bookmarks, and custom binders.\n' +
      '- **Recommendations Engine**: Scored discoverability by course, semester, and curriculum signals.\n' +
      '- **Peer Reviews & Quality**: Academic ratings, helpfulness votes, and constructive moderation feedback.\n' +
      '- **Administrative Governance**: Super Admin control center, audit trail logs, announcements, and disaster recovery.\n' +
      '- **Visual Website Builder**: Dynamic canvas layout designer, navigation manager, and role-based themes.\n' +
      '- **Storage Architecture**: Dual-engine storage supporting local disks and Google Drive.\n\n' +
      '#### Security & Role-Based Access Control (RBAC)\n' +
      'Endpoints require either **Bearer JWT** authorization (`Authorization: Bearer <token>`) or HttpOnly signed session cookies.\n' +
      '- `SCHOLAR` (Student): Explore, preview, download, and bookmark notes.\n' +
      '- `ADMIN`: Upload, edit, and curate academic manuscripts.\n' +
      '- `SUPER_ADMIN`: Comprehensive platform governance, user management, and platform configuration.',
    contact: {
      name: 'PJ Study Engineering Support',
      email: 'support@pjstudy.com',
      url: 'https://pjstudy.com'
    },
    license: {
      name: 'Proprietary',
      url: 'https://pjstudy.com/terms'
    }
  },
  servers: [
    {
      url: 'http://localhost:5001',
      description: 'Local Development Server (Port 5001)'
    },
    {
      url: 'http://localhost:5000',
      description: 'Local Fallback Server (Port 5000)'
    },
    {
      url: 'https://api.pjstudy.com',
      description: 'Production Cloud API (Render)'
    }
  ],
  tags: [
    { name: 'Health & System', description: 'System health probes, configuration, and sitemaps' },
    { name: 'Authentication', description: 'User registration, login, token refresh, and password management' },
    { name: 'Notes & Manuscripts', description: 'Catalog search, inline reading, downloads, and manuscript publication' },
    { name: 'Student Dashboard', description: 'Personalized workspace, enrolled subjects, and resume reading' },
    { name: 'Student Profile & Library', description: 'Scholar profile, bookmarks, personal binders, and privacy' },
    { name: 'Curriculum Taxonomy', description: 'Universities, schools, courses, semesters, and subjects' },
    { name: 'Recommendations', description: 'Course and semester-aligned academic recommendation engine' },
    { name: 'Reviews & Ratings', description: 'Peer reviews, ratings, helpfulness votes, and moderation reports' },
    { name: 'Notifications', description: 'Real-time student alerts and announcements' },
    { name: 'Storage & Drive', description: 'Unified file storage and private Google Drive integration' },
    { name: 'Admin Workspace', description: 'Moderator and Admin manuscript review queue and management' },
    { name: 'Super Admin', description: 'Full platform management, analytics, user roles, and system audit logs' },
    { name: 'Visual Website Builder', description: 'Visual Studio canvas, pages, navigation, and theme customizer' }
  ],
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Paste your access token: `Bearer <jwt_token>`'
    },
    cookieAuth: {
      type: 'apiKey',
      in: 'cookie',
      name: 'accessToken',
      description: 'HttpOnly signed session cookie containing JWT'
    }
  }
};

/**
 * Editorial branding styles for Swagger UI
 */
export const customSwaggerCss = `
  .swagger-ui .topbar {
    background-color: #173d2f !important;
    border-bottom: 2px solid #245c46;
    padding: 12px 0;
  }
  .swagger-ui .topbar .topbar-wrapper a span {
    color: #ffffff;
    font-weight: 700;
    font-size: 1.2rem;
    letter-spacing: -0.015em;
  }
  .swagger-ui .topbar .topbar-wrapper a::before {
    content: "📚 ";
    font-size: 1.35rem;
  }
  .swagger-ui .info h2.title {
    color: #173d2f;
    font-family: inherit;
    font-size: 1.85rem;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  .swagger-ui .btn.authorize {
    background-color: #245c46 !important;
    border-color: #245c46 !important;
    color: #ffffff !important;
    border-radius: 6px;
    font-weight: 600;
  }
  .swagger-ui .btn.authorize svg {
    fill: #ffffff !important;
  }
  .swagger-ui .opblock.opblock-post .opblock-summary-method {
    background: #245c46 !important;
    border-radius: 4px;
  }
  .swagger-ui .opblock.opblock-get .opblock-summary-method {
    background: #0284c7 !important;
    border-radius: 4px;
  }
  .swagger-ui .opblock.opblock-patch .opblock-summary-method {
    background: #7c3aed !important;
    border-radius: 4px;
  }
  .swagger-ui .opblock.opblock-delete .opblock-summary-method {
    background: #dc2626 !important;
    border-radius: 4px;
  }
  .swagger-ui .opblock {
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0,0,0,0.03);
  }
`;
