/**
 * Admin Workspace (Faculty Reviewer / Moderator) Paths
 */
export const adminWorkspacePaths = {
  '/api/v1/admin-workspace/overview': {
    get: {
      tags: ['Admin Workspace'],
      summary: 'Get Admin Workspace review queue metrics',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'Workspace metrics (pending reviews, verified today, open reports)',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/StandardResponse' }
            }
          }
        },
        403: { description: 'Requires MODERATOR, ADMIN, or SUPER_ADMIN role' }
      }
    }
  },
  '/api/v1/admin-workspace/queue': {
    get: {
      tags: ['Admin Workspace'],
      summary: 'Get pending manuscript moderation queue',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } }
      ],
      responses: {
        200: {
          description: 'List of manuscripts pending editorial verification',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      queue: { type: 'array', items: { $ref: '#/components/schemas/Note' } }
                    }
                  }
                }
              }
            }
          }
        },
        403: { description: 'Staff access required' }
      }
    }
  },
  '/api/v1/admin-workspace/reports': {
    get: {
      tags: ['Admin Workspace'],
      summary: 'Get reported reviews & flag queue',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: { description: 'List of reported reviews' },
        403: { description: 'Staff access required' }
      }
    }
  },
  '/api/v1/admin-workspace/history': {
    get: {
      tags: ['Admin Workspace'],
      summary: 'Get moderation activity audit history',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: { description: 'Recent editorial actions taken by reviewer' },
        403: { description: 'Staff access required' }
      }
    }
  }
};
