/**
 * Common and Standard API Schemas
 */
export const commonSchemas = {
  StandardResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      message: { type: 'string', example: 'Operation completed successfully.' },
      data: { type: 'object' }
    }
  },
  ErrorResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      error: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'VALIDATION_ERROR' },
          message: { type: 'string', example: 'Detailed description of the error.' },
          statusCode: { type: 'integer', example: 400 },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'email' },
                message: { type: 'string', example: 'Invalid email address format.' }
              }
            }
          }
        }
      }
    }
  },
  PaginationMeta: {
    type: 'object',
    properties: {
      page: { type: 'integer', example: 1 },
      limit: { type: 'integer', example: 12 },
      totalItems: { type: 'integer', example: 45 },
      totalPages: { type: 'integer', example: 4 }
    }
  }
};
