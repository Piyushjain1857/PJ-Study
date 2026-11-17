/**
 * Admin Governance, Analytics, Audit Logs, and Storage Schemas
 */
export const adminSchemas = {
  AuditLog: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      action: { type: 'string', example: 'NOTE_CREATED' },
      entityType: { type: 'string', example: 'NOTE' },
      entityId: { type: 'string', example: 'f0279325-92f7-48a1-8beb-86c70fb446c5' },
      actorId: { type: 'string', format: 'uuid', nullable: true },
      actorRole: { type: 'string', example: 'ADMIN' },
      ipAddress: { type: 'string', example: '127.0.0.1' },
      userAgent: { type: 'string', example: 'Mozilla/5.0...' },
      details: { type: 'object' },
      createdAt: { type: 'string', format: 'date-time' }
    }
  },
  Announcement: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      title: { type: 'string', example: 'Midterm Examination Notes Now Available' },
      content: { type: 'string', example: 'All faculty have uploaded unit 3 revision guides.' },
      type: { type: 'string', enum: ['INFO', 'WARNING', 'URGENT', 'UPDATE'], example: 'INFO' },
      targetRole: { type: 'string', enum: ['ALL', 'STUDENT', 'MODERATOR', 'ADMIN'], example: 'ALL' },
      expiresAt: { type: 'string', format: 'date-time', nullable: true },
      createdAt: { type: 'string', format: 'date-time' }
    }
  },
  PlatformSettings: {
    type: 'object',
    properties: {
      allowRegistration: { type: 'boolean', example: true },
      requireEmailVerification: { type: 'boolean', example: false },
      maxUploadSizeMb: { type: 'integer', example: 50 },
      allowedFileTypes: {
        type: 'array',
        items: { type: 'string' },
        example: ['pdf', 'docx', 'pptx', 'xlsx', 'txt', 'png', 'jpg']
      },
      enableGoogleDriveStorage: { type: 'boolean', example: true },
      enableAnonymousBrowse: { type: 'boolean', example: true }
    }
  },
  StorageStatus: {
    type: 'object',
    properties: {
      activeProvider: { type: 'string', example: 'google_drive' },
      localDisk: {
        type: 'object',
        properties: {
          isAccessible: { type: 'boolean', example: true },
          uploadsDirectory: { type: 'string', example: 'backend/uploads' }
        }
      },
      googleDrive: {
        type: 'object',
        properties: {
          isConfigured: { type: 'boolean', example: true },
          hasFolder: { type: 'boolean', example: true },
          clientEmail: { type: 'string', example: 'pjstudy-service@developer.gserviceaccount.com' }
        }
      }
    }
  },
  Review: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      noteId: { type: 'string', format: 'uuid' },
      userId: { type: 'string', format: 'uuid' },
      rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
      title: { type: 'string', example: 'Clear explanations and diagrams' },
      comment: { type: 'string', example: 'Helped me prepare for the semester exam effectively.' },
      status: { type: 'string', enum: ['PUBLISHED', 'HIDDEN', 'FLAGGED'], example: 'PUBLISHED' },
      helpfulCount: { type: 'integer', example: 8 },
      createdAt: { type: 'string', format: 'date-time' }
    }
  },
  Notification: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      userId: { type: 'string', format: 'uuid' },
      type: { type: 'string', example: 'NOTE_PUBLISHED' },
      title: { type: 'string', example: 'New Note in Electronics' },
      message: { type: 'string', example: 'Digital Logic Unit 1 has just been published.' },
      isRead: { type: 'boolean', example: false },
      createdAt: { type: 'string', format: 'date-time' }
    }
  }
};
