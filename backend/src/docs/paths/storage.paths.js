/**
 * Storage Infrastructure & Google Drive Paths
 */
export const storagePaths = {
  '/api/v1/storage/status': {
    get: {
      tags: ['Storage & Drive'],
      summary: 'Check storage health and active Google Drive connectivity',
      description: 'Reports active storage provider (local or google_drive), readiness, and diagnostic metadata without exposing secret credentials.',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'Storage provider operational status',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/StorageStatus' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/v1/storage/google/oauth/url': {
    get: {
      tags: ['Storage & Drive'],
      summary: 'Generate Google Drive OAuth consent URL (Super Admin)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'OAuth authorization URL for connecting private institutional Google Drive',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      authUrl: { type: 'string', example: 'https://accounts.google.com/o/oauth2/v2/auth?...' }
                    }
                  }
                }
              }
            }
          }
        },
        403: { description: 'Super Admin only' }
      }
    }
  },
  '/api/v1/storage/google/oauth/callback': {
    get: {
      tags: ['Storage & Drive'],
      summary: 'Google OAuth callback exchange handler',
      parameters: [{ name: 'code', in: 'query', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Google Drive connected successfully' },
        400: { description: 'Missing authorization code' }
      }
    }
  }
};
