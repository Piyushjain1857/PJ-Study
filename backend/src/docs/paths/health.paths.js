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
  '/health/live': {
    get: {
      tags: ['Health & System'],
      summary: 'Liveness probe (process uptime)',
      description: 'Container orchestrator liveness check indicating if process event loop is active.',
      responses: {
        200: {
          description: 'Process is alive',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  status: { type: 'string', example: 'alive' },
                  uptimeSeconds: { type: 'integer', example: 1240 },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/health/ready': {
    get: {
      tags: ['Health & System'],
      summary: 'Readiness probe (database connectivity)',
      description: 'Container orchestrator readiness probe verifying database connectivity via pure read-only ping.',
      responses: {
        200: {
          description: 'Database is connected and ready to serve traffic',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  status: { type: 'string', example: 'ready' },
                  database: { type: 'string', example: 'connected' },
                  uptimeSeconds: { type: 'integer', example: 1240 },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        503: {
          description: 'Database service is degraded or unavailable'
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
