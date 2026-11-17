/**
 * Health & Public Configuration Endpoints
 */
export const healthPaths = {
  '/health': {
    get: {
      tags: ['Health & System'],
      summary: 'System health probe',
      description: 'L4/L7 load balancer health check returning system uptime and process status.',
      responses: {
        200: {
          description: 'Server is healthy',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'healthy' },
                      product: { type: 'string', example: 'PJ Study' },
                      uptimeSeconds: { type: 'integer', example: 1240 },
                      timestamp: { type: 'string', format: 'date-time' },
                      environment: { type: 'string', example: 'development' }
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
  '/api/v1/health': {
    get: {
      tags: ['Health & System'],
      summary: 'API v1 health status probe',
      description: 'Returns product tagline, API version, and uptime metrics.',
      responses: {
        200: {
          description: 'API v1 operational health',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/StandardResponse' }
            }
          }
        }
      }
    }
  },
  '/api/v1/config': {
    get: {
      tags: ['Health & System'],
      summary: 'Public platform configuration metadata',
      description: 'Centralizes public brand identity, active features, and platform status without exposing secrets.',
      responses: {
        200: {
          description: 'Public platform configuration',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      product: { type: 'string', example: 'PJ Study' },
                      tagline: { type: 'string', example: 'Your Entire Study World, One Place.' },
                      version: { type: 'string', example: '1.0.0' },
                      environment: { type: 'string', example: 'development' },
                      features: { type: 'object' }
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
};
