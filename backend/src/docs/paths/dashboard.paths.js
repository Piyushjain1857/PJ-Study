/**
 * Student Dashboard & Learning Analytics Paths
 */
export const dashboardPaths = {
  '/api/v1/dashboard/overview': {
    get: {
      tags: ['Student Dashboard'],
      summary: 'Get personalized student workspace overview',
      description: 'Returns student workspace sections: greeting metadata, continue reading, curriculum subjects, recommendations, recent catalog releases, and bookmarks.',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'Personalized dashboard payload',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      studentInfo: { type: 'object' },
                      studentSubjects: { type: 'array', items: { $ref: '#/components/schemas/Subject' } },
                      recommendedNotes: { type: 'array', items: { $ref: '#/components/schemas/Note' } },
                      recentPublishedNotes: { type: 'array', items: { $ref: '#/components/schemas/Note' } },
                      recentBookmarks: { type: 'array', items: { type: 'object' } },
                      stats: { type: 'object' }
                    }
                  }
                }
              }
            }
          }
        },
        401: { description: 'Authentication required' }
      }
    }
  },
  '/api/v1/dashboard/analytics': {
    get: {
      tags: ['Student Dashboard'],
      summary: 'Get student activity trends & reading habits',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'Personal learning activity data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'object' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/v1/dashboard/downloads': {
    get: {
      tags: ['Student Dashboard'],
      summary: 'Get student download history',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'List of downloaded manuscripts',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: { type: 'object' } }
                }
              }
            }
          }
        }
      }
    }
  }
};
