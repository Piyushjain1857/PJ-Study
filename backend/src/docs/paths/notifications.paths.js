/**
 * Notifications and Delivery Preferences Paths
 */
export const notificationsPaths = {
  '/api/v1/notifications': {
    get: {
      tags: ['Notifications'],
      summary: 'Get notifications list for current student',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } }
      ],
      responses: {
        200: {
          description: 'Notifications list',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      notifications: { type: 'array', items: { $ref: '#/components/schemas/Notification' } },
                      unreadCount: { type: 'integer', example: 3 }
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
  '/api/v1/notifications/unread-count': {
    get: {
      tags: ['Notifications'],
      summary: 'Get total unread notifications count',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'Unread badge count',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      unreadCount: { type: 'integer', example: 3 }
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
  '/api/v1/notifications/{id}/read': {
    patch: {
      tags: ['Notifications'],
      summary: 'Mark single notification as read',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'Notification marked as read' }
      }
    }
  },
  '/api/v1/notifications/read-all': {
    patch: {
      tags: ['Notifications'],
      summary: 'Mark all unread notifications as read',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: { description: 'All notifications marked as read' }
      }
    }
  },
  '/api/v1/notifications/preferences': {
    get: {
      tags: ['Notifications'],
      summary: 'Get notification delivery preferences',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: { description: 'User notification settings' }
      }
    },
    patch: {
      tags: ['Notifications'],
      summary: 'Update notification delivery preferences',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                emailDigest: { type: 'boolean' },
                newNotesAlert: { type: 'boolean' }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Preferences updated' }
      }
    }
  }
};
