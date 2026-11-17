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
  '/api/v1/profile/avatar/{filename}': {
    get: {
      tags: ['Student Profile & Library'],
      summary: 'Serve user avatar image',
      parameters: [{ name: 'filename', in: 'path', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Image file stream' },
        404: { description: 'Avatar file not found' }
      }
    }
  },
  '/api/v1/profile/me/avatar': {
    post: {
      tags: ['Student Profile & Library'],
      summary: 'Upload user profile avatar image',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['avatar'],
              properties: {
                avatar: { type: 'string', format: 'binary', description: 'JPEG/PNG/WEBP image up to 5MB' }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Avatar updated' },
        400: { description: 'Invalid image format or size' }
      }
    },
    delete: {
      tags: ['Student Profile & Library'],
      summary: 'Remove user avatar and reset to default',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: { description: 'Avatar reset' }
      }
    }
  },
  '/api/v1/profile/me/privacy': {
    patch: {
      tags: ['Student Profile & Library'],
      summary: 'Update student profile privacy preferences',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                showEmail: { type: 'boolean' },
                showEnrolledCourse: { type: 'boolean' },
                isPublicContributor: { type: 'boolean' }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Privacy preferences saved' }
      }
    }
  },
  '/api/v1/profile/me/uploads': {
    get: {
      tags: ['Student Profile & Library'],
      summary: 'Get all manuscripts uploaded by logged-in scholar',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'Uploaded notes',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: { $ref: '#/components/schemas/Note' } }
                }
              }
            }
          }
        }
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
