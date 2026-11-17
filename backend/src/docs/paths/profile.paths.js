/**
 * Scholar Profile, Avatar, Privacy, and Contributor Paths
 */
export const profilePaths = {
  '/api/v1/profile/me': {
    get: {
      tags: ['Student Profile & Library'],
      summary: 'Get current user profile',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'Profile data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/User' }
                }
              }
            }
          }
        }
      }
    },
    patch: {
      tags: ['Student Profile & Library'],
      summary: 'Update scholar profile information',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Alex Rivera' },
                courseId: { type: 'string', format: 'uuid' },
                semester: { type: 'integer', example: 4 },
                academicYear: { type: 'string', example: '2026-2027' }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Profile updated' }
      }
    }
  },
  '/api/v1/profile/me/stats': {
    get: {
      tags: ['Student Profile & Library'],
      summary: 'Get scholar personal learning statistics',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: { description: 'User personal stats (bookmarks, uploads, ratings)' }
      }
    }
  },
  '/api/v1/profile/academic-options': {
    get: {
      tags: ['Student Profile & Library'],
      summary: 'Get dropdown options for scholar profile setup',
      description: 'Returns available universities, schools, courses, and valid semesters for student onboarding.',
      responses: {
        200: { description: 'Academic options' }
      }
    }
  },
  '/api/v1/contributors/{userId}': {
    get: {
      tags: ['Student Profile & Library'],
      summary: 'Get public contributor profile by ID',
      parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'Public contributor profile' },
        404: { description: 'Contributor not found' }
      }
    }
  },
  '/api/v1/contributors/{userId}/notes': {
    get: {
      tags: ['Student Profile & Library'],
      summary: 'Get public published manuscripts uploaded by contributor',
      parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'List of contributor approved manuscripts' }
      }
    }
  }
};
