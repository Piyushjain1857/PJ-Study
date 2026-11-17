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
