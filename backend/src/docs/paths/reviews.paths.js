/**
 * Notes Ratings, Reviews, and Feedback Paths
 */
export const reviewsPaths = {
  '/api/v1/notes/{id}/rating-summary': {
    get: {
      tags: ['Reviews & Ratings'],
      summary: 'Get rating metrics and score distribution for a note',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: {
          description: 'Rating summary',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/NoteRatingSummary' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/v1/notes/{id}/reviews': {
    get: {
      tags: ['Reviews & Ratings'],
      summary: 'List peer reviews for a note',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 5 } }
      ],
      responses: {
        200: {
          description: 'Paginated list of published reviews',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      reviews: { type: 'array', items: { $ref: '#/components/schemas/Review' } },
                      pagination: { $ref: '#/components/schemas/PaginationMeta' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['Reviews & Ratings'],
      summary: 'Submit a rating & review for a note',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['rating'],
              properties: {
                rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
                title: { type: 'string', example: 'Comprehensive formulas' },
                comment: { type: 'string', example: 'Great coverage of second-order differential equations.' }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Review submitted' },
        400: { description: 'Already reviewed or invalid rating' }
      }
    }
  },
  '/api/v1/reviews/{id}/helpful': {
    put: {
      tags: ['Reviews & Ratings'],
      summary: 'Upvote a review as helpful',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'Helpful vote recorded' }
      }
    },
    delete: {
      tags: ['Reviews & Ratings'],
      summary: 'Remove helpful upvote from review',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'Helpful vote removed' }
      }
    }
  },
  '/api/v1/reviews/{id}/reports': {
    post: {
      tags: ['Reviews & Ratings'],
      summary: 'Report an inappropriate review for moderation',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['reason'],
              properties: {
                reason: { type: 'string', example: 'Spam or irrelevant commercial links.' }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Review reported to moderation staff' }
      }
    }
  }
};
