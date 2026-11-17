/**
 * Notes, Manuscripts, Downloads, and Moderation Paths
 */
export const notesPaths = {
  '/api/v1/notes': {
    get: {
      tags: ['Notes & Manuscripts'],
      summary: 'List published study notes (Public library)',
      description: 'Returns published notes filtered by course, semester, subject, or search term.',
      parameters: [
        { name: 'search', in: 'query', schema: { type: 'string' } },
        { name: 'courseId', in: 'query', schema: { type: 'string', format: 'uuid' } },
        { name: 'subjectId', in: 'query', schema: { type: 'string', format: 'uuid' } },
        { name: 'categoryId', in: 'query', schema: { type: 'string', format: 'uuid' } },
        { name: 'semester', in: 'query', schema: { type: 'integer' } },
        { name: 'sortBy', in: 'query', schema: { type: 'string', enum: ['newest', 'popular', 'rating', 'title'] } },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 } }
      ],
      responses: {
        200: {
          description: 'Paginated notes response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      notes: { type: 'array', items: { $ref: '#/components/schemas/Note' } },
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
      tags: ['Notes & Manuscripts'],
      summary: 'Upload and publish academic manuscript',
      description: 'Authorized note upload for ADMIN and SUPER_ADMIN roles. SCHOLARS are strictly blocked (HTTP 403). Notes publish immediately upon successful storage.',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: { $ref: '#/components/schemas/CreateNoteRequest' }
          }
        }
      },
      responses: {
        201: {
          description: 'Note uploaded and published successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Note' }
                }
              }
            }
          }
        },
        400: { description: 'Validation failed or missing required fields' },
        401: { description: 'Authentication required' },
        403: { description: 'Forbidden: Scholars cannot upload notes' }
      }
    }
  },
  '/api/v1/notes/explore': {
    get: {
      tags: ['Notes & Manuscripts'],
      summary: 'Search & explore public catalog',
      description: 'Dedicated exploration endpoint for student search, tag browsing, and faceted filtering.',
      parameters: [
        { name: 'search', in: 'query', schema: { type: 'string' } },
        { name: 'courseId', in: 'query', schema: { type: 'string', format: 'uuid' } },
        { name: 'subjectId', in: 'query', schema: { type: 'string', format: 'uuid' } },
        { name: 'categoryId', in: 'query', schema: { type: 'string', format: 'uuid' } },
        { name: 'semester', in: 'query', schema: { type: 'integer' } },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 } }
      ],
      responses: {
        200: {
          description: 'Exploration catalog results',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      notes: { type: 'array', items: { $ref: '#/components/schemas/Note' } },
                      pagination: { $ref: '#/components/schemas/PaginationMeta' }
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
  '/api/v1/notes/explore/filters': {
    get: {
      tags: ['Notes & Manuscripts'],
      summary: 'Get active academic taxonomy filter options',
      description: 'Returns available courses, subjects, categories, and semesters with active note counts.',
      responses: {
        200: {
          description: 'Faceted filter options',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      courses: { type: 'array', items: { $ref: '#/components/schemas/Course' } },
                      categories: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
                      subjects: { type: 'array', items: { $ref: '#/components/schemas/Subject' } },
                      semesters: { type: 'array', items: { type: 'integer' } },
                      totalApprovedNotes: { type: 'integer', example: 2 }
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
  '/api/v1/notes/{id}': {
    get: {
      tags: ['Notes & Manuscripts'],
      summary: 'Get note details by ID',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: {
          description: 'Note details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { $ref: '#/components/schemas/Note' }
                }
              }
            }
          }
        },
        404: { description: 'Study note not found' }
      }
    },
    patch: {
      tags: ['Notes & Manuscripts'],
      summary: 'Update note metadata',
      description: 'Only the note owner, Admin, or Super Admin can edit note metadata.',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                content: { type: 'string' },
                semester: { type: 'integer' }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Note updated successfully' },
        401: { description: 'Authentication required' },
        403: { description: 'Not authorized to edit this note' }
      }
    },
    delete: {
      tags: ['Notes & Manuscripts'],
      summary: 'Delete a study note',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'Note deleted' },
        401: { description: 'Authentication required' },
        403: { description: 'Forbidden' }
      }
    }
  },
  '/api/v1/notes/{id}/download': {
    get: {
      tags: ['Notes & Manuscripts'],
      summary: 'Download note attachment file',
      description: 'Streams the attached document from Google Drive or local storage and increments download counters.',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: {
          description: 'Binary document file stream (PDF, DOCX, XLSX, Images)',
          content: {
            'application/pdf': {},
            'application/octet-stream': {}
          }
        },
        404: { description: 'Note has no attached file or note not found' }
      }
    }
  },
  '/api/v1/notes/{id}/preview': {
    get: {
      tags: ['Notes & Manuscripts'],
      summary: 'Inline browser preview of document',
      description: 'Streams file with inline disposition for browser PDF/image rendering without exposing private Drive IDs.',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'Inline binary document stream' }
      }
    }
  },
  '/api/v1/notes/{id}/bookmark': {
    post: {
      tags: ['Student Profile & Library'],
      summary: 'Bookmark a note to personal library',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'Note added to library' },
        401: { description: 'Authentication required' }
      }
    },
    delete: {
      tags: ['Student Profile & Library'],
      summary: 'Remove note bookmark',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'Bookmark removed' },
        401: { description: 'Authentication required' }
      }
    }
  },
  '/api/v1/notes/bookmarks': {
    get: {
      tags: ['Student Profile & Library'],
      summary: 'Get all saved bookmarks of student',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'List of bookmarked notes',
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
  '/api/v1/notes/me': {
    get: {
      tags: ['Notes & Manuscripts'],
      summary: 'Get notes uploaded by current user',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'User uploaded notes',
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
        },
        401: { description: 'Authentication required' }
      }
    }
  },
  '/api/v1/notes/moderation/queue': {
    get: {
      tags: ['Admin Workspace'],
      summary: 'Get staff moderation queue (Admin & Super Admin)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: { description: 'Pending review notes queue' },
        403: { description: 'Requires ADMIN or SUPER_ADMIN role' }
      }
    }
  },
  '/api/v1/notes/{id}/file': {
    get: {
      tags: ['Notes & Manuscripts'],
      summary: 'Stream attached file directly',
      description: 'Streams file with optional inline disposition query param (?inline=true).',
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        { name: 'inline', in: 'query', schema: { type: 'boolean' } }
      ],
      responses: {
        200: { description: 'Binary stream' },
        404: { description: 'File or note not found' }
      }
    }
  },
  '/api/v1/notes/{id}/submit': {
    post: {
      tags: ['Notes & Manuscripts'],
      summary: 'Submit a draft note for editorial review',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'Note submitted for review' },
        403: { description: 'Owner or admin only' }
      }
    }
  },
  '/api/v1/notes/{id}/publish': {
    patch: {
      tags: ['Notes & Manuscripts'],
      summary: 'Publish an approved note to catalog immediately',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'Note published' },
        403: { description: 'Admin or Super Admin only' }
      }
    }
  },
  '/api/v1/notes/{id}/unpublish': {
    patch: {
      tags: ['Notes & Manuscripts'],
      summary: 'Unpublish note from catalog back to draft',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'Note unpublished' },
        403: { description: 'Admin or Super Admin only' }
      }
    }
  },
  '/api/v1/notes/{id}/archive': {
    post: {
      tags: ['Notes & Manuscripts'],
      summary: 'Archive a note (removes from active search)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'Note archived' },
        403: { description: 'Owner or admin only' }
      }
    }
  },
  '/api/v1/notes/{id}/review': {
    post: {
      tags: ['Admin Workspace'],
      summary: 'Moderate a note (Approve or Request Revision)',
      description: 'Allows Admin/Super Admin to approve a manuscript or request revisions with constructive feedback.',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: { type: 'string', enum: ['APPROVED', 'REJECTED'] },
                rejectionReason: { type: 'string', example: 'Please provide missing page 4 diagrams.' }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Moderation action applied' },
        403: { description: 'Requires ADMIN or SUPER_ADMIN role' }
      }
    }
  },
  '/api/v1/notes/{id}/reviews/{reviewId}': {
    patch: {
      tags: ['Reviews & Ratings'],
      summary: 'Update own review',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        { name: 'reviewId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                rating: { type: 'integer', minimum: 1, maximum: 5 },
                title: { type: 'string' },
                comment: { type: 'string' }
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Review updated' }
      }
    },
    delete: {
      tags: ['Reviews & Ratings'],
      summary: 'Delete own review',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        { name: 'reviewId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
      ],
      responses: {
        200: { description: 'Review deleted' }
      }
    }
  },
  '/api/v1/users/me/notes': {
    get: {
      tags: ['Student Profile & Library'],
      summary: 'Get notes created or saved by current user',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'Current user notes',
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
  }
};
