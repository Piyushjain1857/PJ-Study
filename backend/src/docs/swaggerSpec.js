import { swaggerConfig } from './swagger.config.js';
import { commonSchemas } from './schemas/common.schemas.js';
import { authSchemas } from './schemas/auth.schemas.js';
import { noteSchemas } from './schemas/note.schemas.js';
import { academicSchemas } from './schemas/academic.schemas.js';
import { adminSchemas } from './schemas/admin.schemas.js';

import { healthPaths } from './paths/health.paths.js';
import { authPaths } from './paths/auth.paths.js';
import { notesPaths } from './paths/notes.paths.js';
import { dashboardPaths } from './paths/dashboard.paths.js';
import { academicsPaths } from './paths/academics.paths.js';
import { recommendationsPaths } from './paths/recommendations.paths.js';
import { reviewsPaths } from './paths/reviews.paths.js';
import { profilePaths } from './paths/profile.paths.js';
import { notificationsPaths } from './paths/notifications.paths.js';
import { storagePaths } from './paths/storage.paths.js';
import { adminWorkspacePaths } from './paths/adminWorkspace.paths.js';
import { adminPaths } from './paths/admin.paths.js';
import { platformConfigPaths } from './paths/platformConfig.paths.js';

/**
 * Aggregated OpenAPI 3.0.3 specification for PJ Study.
 */
export const swaggerSpec = {
  openapi: swaggerConfig.openapi,
  info: swaggerConfig.info,
  servers: swaggerConfig.servers,
  tags: swaggerConfig.tags,
  components: {
    securitySchemes: swaggerConfig.securitySchemes,
    schemas: {
      ...commonSchemas,
      ...authSchemas,
      ...noteSchemas,
      ...academicSchemas,
      ...adminSchemas
    }
  },
  paths: {
    ...healthPaths,
    ...authPaths,
    ...notesPaths,
    ...dashboardPaths,
    ...academicsPaths,
    ...recommendationsPaths,
    ...reviewsPaths,
    ...profilePaths,
    ...notificationsPaths,
    ...storagePaths,
    ...adminWorkspacePaths,
    ...adminPaths,
    ...platformConfigPaths
  }
};

export default swaggerSpec;
