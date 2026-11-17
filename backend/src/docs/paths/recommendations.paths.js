/**
 * Recommendations Engine Paths
 */
export const recommendationsPaths = {
  '/api/v1/recommendations/notes': {
    get: {
      tags: ['Recommendations'],
      summary: 'Get personalized study note recommendations',
      description: 'Scores candidates based on student enrollment, course match, active semester, and viewing history.',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 6 } }],
      responses: {
        200: {
          description: 'Personalized recommendations with explanation reasons',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      personalized: { type: 'boolean', example: true },
                      fallback: { type: 'boolean', example: false },
                      recommendations: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            note: { $ref: '#/components/schemas/Note' },
                            reason: { type: 'string', example: 'Matches your Semester 4 curriculum' },
                            score: { type: 'number', example: 12.5 }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/v1/recommendations/notes/popular': {
    get: {
      tags: ['Recommendations'],
      summary: 'Get trending and popular notes',
      parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 6 } }],
      responses: {
        200: { description: 'Trending notes across university catalog' }
      }
    }
  },
  '/api/v1/recommendations/notes/recent': {
    get: {
      tags: ['Recommendations'],
      summary: 'Get recently published approved notes',
      parameters: [{ name: 'limit', in: 'query', schema: { type: 'integer', default: 6 } }],
      responses: {
        200: { description: 'Recently added notes' }
      }
    }
  },
  '/api/v1/recommendations/notes/similar/{noteId}': {
    get: {
      tags: ['Recommendations'],
      summary: 'Get similar manuscripts for a given note',
      parameters: [{ name: 'noteId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'Curated similar study resources' }
      }
    }
  },
  '/api/v1/recommendations/notes/subjects': {
    get: {
      tags: ['Recommendations'],
      summary: 'Get recommendations based on enrolled subjects',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: { description: 'Subject-specific notes recommendations' }
      }
    }
  }
};
