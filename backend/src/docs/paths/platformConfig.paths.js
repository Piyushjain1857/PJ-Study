/**
 * Visual Website Builder & Platform Dynamic Configuration Paths
 */
export const platformConfigPaths = {
  '/api/v1/platform/config/public': {
    get: {
      tags: ['Visual Website Builder'],
      summary: 'Get public website layout and visual tokens',
      description: 'Delivers active landing page layout, hero configuration, feature toggles, and brand themes.',
      responses: {
        200: {
          description: 'Active public layout configuration',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/StandardResponse' }
            }
          }
        }
      }
    }
  },
  '/api/v1/platform/config/workspace': {
    get: {
      tags: ['Visual Website Builder'],
      summary: 'Get workspace layout configuration for authenticated role',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: { description: 'Role-specific workspace navigation, sidebar, and layout configuration' }
      }
    }
  },
  '/api/v1/admin/config/pages': {
    get: {
      tags: ['Visual Website Builder'],
      summary: 'List all visual builder pages & canvas definitions',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: { description: 'All managed pages list' },
        403: { description: 'Super Admin only' }
      }
    }
  },
  '/api/v1/admin/config/pages/{pageKey}': {
    get: {
      tags: ['Visual Website Builder'],
      summary: 'Get canvas draft state for a specific page',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'pageKey', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Page canvas draft' },
        403: { description: 'Super Admin only' }
      }
    },
    patch: {
      tags: ['Visual Website Builder'],
      summary: 'Save working draft changes to page canvas',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'pageKey', in: 'path', required: true, schema: { type: 'string' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { type: 'object' }
          }
        }
      },
      responses: {
        200: { description: 'Draft saved' },
        403: { description: 'Super Admin only' }
      }
    }
  },
  '/api/v1/admin/config/pages/{pageKey}/publish': {
    post: {
      tags: ['Visual Website Builder'],
      summary: 'Publish canvas draft changes to production users',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'pageKey', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Canvas published immediately' },
        403: { description: 'Super Admin only' }
      }
    }
  },
  '/api/v1/admin/config/navigation': {
    get: {
      tags: ['Visual Website Builder'],
      summary: 'Get navigation structures across roles',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: { description: 'Navigation layouts across STUDENT, MODERATOR, and ADMIN' },
        403: { description: 'Super Admin only' }
      }
    }
  },
  '/api/v1/admin/config/themes': {
    get: {
      tags: ['Visual Website Builder'],
      summary: 'Get active CSS theme tokens & palette',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: { description: 'Visual themes and color tokens' },
        403: { description: 'Super Admin only' }
      }
    }
  },
  '/api/v1/admin/config/history': {
    get: {
      tags: ['Visual Website Builder'],
      summary: 'Get configuration version history & snapshots',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: { description: 'Version snapshots for visual layouts' },
        403: { description: 'Super Admin only' }
      }
    }
  },
  '/api/v1/admin/config/restore/{versionId}': {
    post: {
      tags: ['Visual Website Builder'],
      summary: 'Rollback visual layout to an earlier version snapshot',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'versionId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'Visual state reverted' },
        403: { description: 'Super Admin only' }
      }
    }
  }
};
