/**
 * PJ Study - OpenAPI 3.0.3 Specification
 * Provides interactive documentation and API testing explorer for developers,
 * mobile clients, third-party integrations, and automated testing suites.
 */

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'PJ Study API',
    version: '1.0.0',
    description:
      'Official REST API documentation for PJ Study — Academic Notes & Curated Learning Resource Platform.\n\n' +
      'Supports student library workflows, curriculum navigation, manuscript reading, rating & review systems, and administrative operations.',
    contact: {
      name: 'PJ Study Engineering Team',
      email: 'support@pjstudy.com',
      url: 'https://pjstudy.com'
    },
    license: {
      name: 'Proprietary',
      url: 'https://pjstudy.com/terms'
    }
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Current API v1 Environment'
    },
    {
      url: 'http://localhost:5001/api/v1',
      description: 'Local Development Server'
    }
  ],
  tags: [
    { name: 'Health & System', description: 'System health probes and public metadata' },
    { name: 'Authentication', description: 'User registration, login, token refresh, and password management' },
    { name: 'Notes & Manuscripts', description: 'Academic note discovery, reading, downloads, and creation' },
    { name: 'Student Dashboard', description: 'Personalized student workspace, enrolled subjects, and resume reading' },
    { name: 'Curriculum Taxonomy', description: 'Universities, schools, courses, semesters, and academic subjects' },
    { name: 'Recommendations', description: 'Curated recommendation engine based on course and semester' },
    { name: 'Reviews & Ratings', description: 'Peer reviews, ratings, helpfulness votes, and moderation reports' },
    { name: 'Student Profile & Library', description: 'User profile, saved bookmarks, personal binders, and privacy' },
    { name: 'Notifications', description: 'Real-time student alerts and announcements' },
    { name: 'Storage & Drive', description: 'Unified file storage and private Google Drive integration' },
    { name: 'Admin Workspace', description: 'Moderator and Admin manuscript review queue and management' },
    { name: 'Super Admin', description: 'Full platform management, analytics, user roles, and system audit logs' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide your JWT access token in the header: `Authorization: Bearer <token>`'
      },
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'accessToken',
        description: 'HttpOnly cookie containing the signed session JWT token'
      }
    },
    schemas: {
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
              message: { type: 'string', example: 'Detailed error explanation.' },
              details: { type: 'array', items: { type: 'object' } }
            }
          }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: '1c500b12-2100-41dc-9246-10aee8cfaacd' },
          name: { type: 'string', example: 'Alex Rivera' },
          email: { type: 'string', format: 'email', example: 'student@portal.com' },
          role: { type: 'string', enum: ['STUDENT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'], example: 'STUDENT' },
          courseId: { type: 'string', format: 'uuid', nullable: true },
          semester: { type: 'integer', example: 4, nullable: true },
          isEmailVerified: { type: 'boolean', example: true },
          avatarUrl: { type: 'string', nullable: true }
        }
      },
      Note: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid', example: 'f0279325-92f7-48a1-8beb-86c70fb446c5' },
          title: { type: 'string', example: 'Data Structures & Algorithms in C++' },
          slug: { type: 'string', example: 'data-structures-and-algorithms-in-c-88b12f' },
          description: { type: 'string', example: 'Complete unit 1-4 syllabus notes with time complexity proofs.' },
          content: { type: 'string', nullable: true, example: '# Chapter 1: Asymptotic Analysis...' },
          fileName: { type: 'string', nullable: true, example: 'dsa_unit1_notes.pdf' },
          mimeType: { type: 'string', nullable: true, example: 'application/pdf' },
          fileSize: { type: 'string', nullable: true, example: '1048576' },
          storageProvider: { type: 'string', enum: ['local', 'google_drive'], example: 'local' },
          semester: { type: 'integer', example: 3 },
          status: { type: 'string', enum: ['DRAFT', 'PENDING', 'APPROVED', 'PUBLISHED', 'REJECTED', 'ARCHIVED'], example: 'PUBLISHED' },
          viewCount: { type: 'integer', example: 142 },
          downloadCount: { type: 'integer', example: 38 },
          averageRating: { type: 'number', example: 4.8 },
          totalReviews: { type: 'integer', example: 12 },
          course: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string', example: 'B.Tech Computer Science' },
              code: { type: 'string', example: 'BTECH-CSE' }
            }
          },
          subject: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string', example: 'Data Structures & Algorithms' },
              code: { type: 'string', example: 'CS-301' },
              semester: { type: 'integer', example: 3 }
            }
          },
          uploadedBy: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string', example: 'Faculty Reviewer' },
              role: { type: 'string', example: 'ADMIN' }
            }
          },
          publishedAt: { type: 'string', format: 'date-time' },
          createdAt: { type: 'string', format: 'date-time' }
        }
      },
      Course: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'B.Tech' },
          code: { type: 'string', example: 'B.TECH' },
          slug: { type: 'string', example: 'b-tech' },
          semestersCount: { type: 'integer', example: 8 },
          degreeLevel: { type: 'string', example: 'BACHELORS' },
          isActive: { type: 'boolean', example: true }
        }
      },
      Subject: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Basics of Electronics & Digital Logic Design' },
          code: { type: 'string', example: 'EC-101' },
          slug: { type: 'string', example: 'basics-of-electronics' },
          semester: { type: 'integer', example: 1 },
          credits: { type: 'integer', example: 4 },
          courseId: { type: 'string', format: 'uuid' },
          isActive: { type: 'boolean', example: true }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health & System'],
        summary: 'System health check probe',
        description: 'Returns server operational health, environment, and uptime metrics.',
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
                        uptimeSeconds: { type: 'integer', example: 3600 },
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
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register a new scholar account',
        description: 'Registers a new student account. Role is strictly assigned as STUDENT.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'email', 'password'],
                properties: {
                  name: { type: 'string', example: 'Alex Rivera' },
                  email: { type: 'string', format: 'email', example: 'alex@pjstudy.com' },
                  password: { type: 'string', format: 'password', example: 'StrongP@ssw0rd!' },
                  courseId: { type: 'string', format: 'uuid' },
                  semester: { type: 'integer', example: 4 }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'User registered successfully. Verification email dispatched.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardResponse' }
              }
            }
          },
          400: { description: 'Validation error (e.g. invalid email format)' },
          409: { description: 'Email address already registered' }
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Authenticate and receive JWT token',
        description: 'Authenticates with email and password. Returns user profile and access token.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'student@portal.com' },
                  password: { type: 'string', format: 'password', example: 'Student@123' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Authentication successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        user: { $ref: '#/components/schemas/User' },
                        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsIn...' }
                      }
                    }
                  }
                }
              }
            }
          },
          401: { description: 'Invalid email or password' }
        }
      }
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current authenticated user session',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: {
            description: 'Current session user data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          401: { description: 'Unauthenticated session' }
        }
      }
    },
    '/dashboard/overview': {
      get: {
        tags: ['Student Dashboard'],
        summary: 'Get personalized student workspace overview',
        description:
          'Returns all 10 unified dashboard components: personalized greeting metadata, continue reading history, enrolled curriculum subjects with note counts, recommendations, recent catalog publications, and saved bookmarks.',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: {
            description: 'Personalized dashboard payload',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        studentInfo: { type: 'object' },
                        recentViews: { type: 'array', items: { $ref: '#/components/schemas/Note' } },
                        studentSubjects: { type: 'array', items: { $ref: '#/components/schemas/Subject' } },
                        recommendedNotes: { type: 'array', items: { $ref: '#/components/schemas/Note' } },
                        recentBookmarks: { type: 'array', items: { $ref: '#/components/schemas/Note' } },
                        recentNotes: { type: 'array', items: { $ref: '#/components/schemas/Note' } },
                        stats: { type: 'object' }
                      }
                    }
                  }
                }
              }
            }
          },
          401: { description: 'Authentication required' }
        }
      }
    },
    '/notes/explore': {
      get: {
        tags: ['Notes & Manuscripts'],
        summary: 'Browse and filter academic notes catalog',
        description: 'Public catalog search with filters for course, semester, subject, category, and keywords.',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search keywords' },
          { name: 'courseId', in: 'query', schema: { type: 'string', format: 'uuid' }, description: 'Filter by Course ID' },
          { name: 'subjectId', in: 'query', schema: { type: 'string', format: 'uuid' }, description: 'Filter by Subject ID' },
          { name: 'categoryId', in: 'query', schema: { type: 'string', format: 'uuid' }, description: 'Filter by Category ID' },
          { name: 'semester', in: 'query', schema: { type: 'integer' }, description: 'Filter by Semester (1-8)' },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 12 } }
        ],
        responses: {
          200: {
            description: 'Paginated list of approved notes',
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
                        pagination: { type: 'object' }
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
    '/notes/{id}': {
      get: {
        tags: ['Notes & Manuscripts'],
        summary: 'Get note manuscript details by ID',
        description: 'Returns complete manuscript metadata, author, curriculum taxonomy, and view counters.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
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
      }
    },
    '/notes/{id}/download': {
      get: {
        tags: ['Notes & Manuscripts'],
        summary: 'Download study note attachment file',
        description: 'Streams file securely from Google Drive or local storage. Increments download history.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: {
            description: 'Binary document file stream (PDF, DOCX, PPTX, Image)',
            content: {
              'application/pdf': {},
              'application/octet-stream': {}
            }
          },
          404: { description: 'Note has no attached physical file or note not found' }
        }
      }
    },
    '/notes/{id}/preview': {
      get: {
        tags: ['Notes & Manuscripts'],
        summary: 'Stream document for inline browser preview',
        description: 'Streams note document with inline Content-Disposition for browser PDF and image viewers.',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: { description: 'Inline binary document stream' }
        }
      }
    },
    '/notes': {
      post: {
        tags: ['Notes & Manuscripts'],
        summary: 'Upload and publish academic note manuscript',
        description: 'Strictly restricted to ADMIN and SUPER_ADMIN. SCHOLAR users are blocked (HTTP 403).',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['title', 'subjectId'],
                properties: {
                  title: { type: 'string', example: 'Operating Systems Chapter 2' },
                  description: { type: 'string', example: 'Process synchronization and mutex primitives' },
                  content: { type: 'string', example: 'Detailed study notes content...' },
                  subjectId: { type: 'string', format: 'uuid' },
                  courseId: { type: 'string', format: 'uuid' },
                  categoryId: { type: 'string', format: 'uuid' },
                  semester: { type: 'integer', example: 4 },
                  file: { type: 'string', format: 'binary', description: 'PDF or educational document' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Note uploaded and published successfully',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/StandardResponse' }
              }
            }
          },
          401: { description: 'Authentication required' },
          403: { description: 'Forbidden: Scholars cannot upload notes' }
        }
      }
    },
    '/notes/{id}/bookmark': {
      post: {
        tags: ['Student Profile & Library'],
        summary: 'Bookmark a study note to personal library',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: { description: 'Note added to saved library' }
        }
      },
      delete: {
        tags: ['Student Profile & Library'],
        summary: 'Remove a bookmark from personal library',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }
        ],
        responses: {
          200: { description: 'Note removed from saved library' }
        }
      }
    },
    '/courses': {
      get: {
        tags: ['Curriculum Taxonomy'],
        summary: 'List all academic courses & degree programs',
        responses: {
          200: {
            description: 'Academic courses catalog',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Course' } }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/subjects': {
      get: {
        tags: ['Curriculum Taxonomy'],
        summary: 'List subjects filtered by course and semester',
        parameters: [
          { name: 'courseId', in: 'query', schema: { type: 'string', format: 'uuid' } },
          { name: 'semester', in: 'query', schema: { type: 'integer' } }
        ],
        responses: {
          200: {
            description: 'List of subjects',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'array', items: { $ref: '#/components/schemas/Subject' } }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/storage/status': {
      get: {
        tags: ['Storage & Drive'],
        summary: 'Check storage providers health & Google Drive status',
        security: [{ bearerAuth: [] }, { cookieAuth: [] }],
        responses: {
          200: {
            description: 'Storage status information',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        activeProvider: { type: 'string', example: 'google_drive' },
                        googleDrive: {
                          type: 'object',
                          properties: {
                            isConfigured: { type: 'boolean', example: true },
                            hasFolder: { type: 'boolean', example: true }
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
  }
};

export default swaggerSpec;
