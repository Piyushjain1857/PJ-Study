/**
 * Super Admin Command Center Paths
 */
export const adminPaths = {
  '/api/v1/admin/overview': {
    get: {
      tags: ['Super Admin'],
      summary: 'Platform overview metrics (Super Admin)',
      description: 'Returns real metrics: total users, active manuscripts, downloads, colleges, schools, courses, and pending queues.',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'Platform metrics',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/StandardResponse' }
            }
          }
        },
        403: { description: 'Requires SUPER_ADMIN role' }
      }
    }
  },
  '/api/v1/admin/analytics': {
    get: {
      tags: ['Super Admin'],
      summary: 'Time-series growth analytics and storage breakdown',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'range', in: 'query', schema: { type: 'string', default: '30d' } }],
      responses: {
        200: { description: 'Platform analytics data' },
        403: { description: 'Super Admin only' }
      }
    }
  },
  '/api/v1/admin/users': {
    get: {
      tags: ['Super Admin'],
      summary: 'List and filter platform users',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        { name: 'role', in: 'query', schema: { type: 'string', enum: ['ALL', 'STUDENT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'] } },
        { name: 'search', in: 'query', schema: { type: 'string' } },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
      ],
      responses: {
        200: {
          description: 'Paginated user list',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      users: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                      pagination: { $ref: '#/components/schemas/PaginationMeta' }
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
  '/api/v1/admin/users/{id}/role': {
    patch: {
      tags: ['Super Admin'],
      summary: 'Update user account role (RBAC mutation)',
      description: 'Changes user role. Protected: cannot demote the last remaining active Super Admin.',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['role'],
              properties: {
                role: { type: 'string', enum: ['STUDENT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'], example: 'ADMIN' }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Role updated successfully' },
        400: { description: 'Invalid role or cannot demote last Super Admin' },
        403: { description: 'Super Admin only' }
      }
    }
  },
  '/api/v1/admin/notes': {
    get: {
      tags: ['Super Admin'],
      summary: 'List all notes across all statuses with pagination',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        { name: 'status', in: 'query', schema: { type: 'string', default: 'ALL' } },
        { name: 'search', in: 'query', schema: { type: 'string' } },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
      ],
      responses: {
        200: { description: 'Notes list across all statuses' },
        403: { description: 'Super Admin only' }
      }
    }
  },
  '/api/v1/admin/announcements': {
    get: {
      tags: ['Super Admin'],
      summary: 'List administrative broadcast announcements',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'Announcements list',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: { $ref: '#/components/schemas/Announcement' } }
                }
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['Super Admin'],
      summary: 'Publish platform-wide broadcast announcement',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'content'],
              properties: {
                title: { type: 'string', example: 'System Maintenance Window' },
                content: { type: 'string', example: 'Scheduled maintenance this Sunday at 2 AM IST.' },
                type: { type: 'string', enum: ['INFO', 'WARNING', 'URGENT', 'UPDATE'], example: 'INFO' },
                targetRole: { type: 'string', enum: ['ALL', 'STUDENT', 'MODERATOR', 'ADMIN'], example: 'ALL' }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Announcement dispatched' },
        403: { description: 'Super Admin only' }
      }
    }
  },
  '/api/v1/admin/audit-logs': {
    get: {
      tags: ['Super Admin'],
      summary: 'Get system audit trail log stream',
      description: 'Records administrative mutations, role changes, uploads, deletions, and authentication security events.',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        { name: 'action', in: 'query', schema: { type: 'string' } },
        { name: 'entityType', in: 'query', schema: { type: 'string' } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } }
      ],
      responses: {
        200: {
          description: 'Audit logs stream',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: { $ref: '#/components/schemas/AuditLog' } }
                }
              }
            }
          }
        },
        403: { description: 'Super Admin only' }
      }
    }
  },
  '/api/v1/admin/settings': {
    get: {
      tags: ['Super Admin'],
      summary: 'Get platform operational settings',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'Platform settings',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/PlatformSettings' }
                }
              }
            }
          }
        },
        403: { description: 'Super Admin only' }
      }
    },
    patch: {
      tags: ['Super Admin'],
      summary: 'Update platform operational settings',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PlatformSettings' }
          }
        }
      },
      responses: {
        200: { description: 'Settings updated' },
        403: { description: 'Super Admin only' }
      }
    }
  },
  '/api/v1/admin/health': {
    get: {
      tags: ['Super Admin'],
      summary: 'Deep infrastructure health (DB latency & disk check)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: { description: 'Deep health metrics' },
        403: { description: 'Super Admin only' }
      }
    }
  },
  '/api/v1/admin/backups': {
    get: {
      tags: ['Super Admin'],
      summary: 'Database snapshot & disaster recovery status',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: { description: 'Backup checklist and database readiness' },
        403: { description: 'Super Admin only' }
      }
    }
  }
};
