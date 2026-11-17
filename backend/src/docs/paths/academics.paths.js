/**
 * Curriculum Taxonomy & Academic Management Paths
 */
export const academicsPaths = {
  '/api/v1/academics/overview': {
    get: {
      tags: ['Curriculum Taxonomy'],
      summary: 'Get complete academic hierarchy overview',
      description: 'Returns universities, schools, courses, and active subjects count.',
      responses: {
        200: {
          description: 'Academic overview metadata',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/StandardResponse' }
            }
          }
        }
      }
    }
  },
  '/api/v1/academics/universities': {
    get: {
      tags: ['Curriculum Taxonomy'],
      summary: 'List universities',
      responses: {
        200: {
          description: 'List of universities',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: { $ref: '#/components/schemas/University' } }
                }
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['Curriculum Taxonomy'],
      summary: 'Create university (Super Admin)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'shortName'],
              properties: {
                name: { type: 'string', example: 'Delhi University' },
                shortName: { type: 'string', example: 'DU' }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'University created' },
        403: { description: 'Super Admin only' }
      }
    }
  },
  '/api/v1/academics/courses': {
    get: {
      tags: ['Curriculum Taxonomy'],
      summary: 'List courses within universities',
      responses: {
        200: {
          description: 'Courses list',
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
    },
    post: {
      tags: ['Curriculum Taxonomy'],
      summary: 'Create course program (Super Admin)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'semestersCount'],
              properties: {
                name: { type: 'string', example: 'Bachelor of Computer Applications' },
                code: { type: 'string', example: 'BCA' },
                semestersCount: { type: 'integer', example: 6 },
                degreeLevel: { type: 'string', example: 'Undergraduate' }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Course created' },
        403: { description: 'Super Admin only' }
      }
    }
  },
  '/api/v1/academics/courses/{id}/semesters': {
    get: {
      tags: ['Curriculum Taxonomy'],
      summary: 'Get valid semesters array for course',
      description: 'Returns array [1..semestersCount] matching the dynamic course duration.',
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: {
          description: 'Semesters array',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      courseId: { type: 'string', format: 'uuid' },
                      courseName: { type: 'string', example: 'B.Tech' },
                      semestersCount: { type: 'integer', example: 8 },
                      semesters: { type: 'array', items: { type: 'integer' }, example: [1, 2, 3, 4, 5, 6, 7, 8] }
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
  '/api/v1/academics/subjects': {
    get: {
      tags: ['Curriculum Taxonomy'],
      summary: 'List academic subjects',
      parameters: [
        { name: 'courseId', in: 'query', schema: { type: 'string', format: 'uuid' } },
        { name: 'semester', in: 'query', schema: { type: 'integer' } }
      ],
      responses: {
        200: {
          description: 'List of curriculum subjects',
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
    },
    post: {
      tags: ['Curriculum Taxonomy'],
      summary: 'Create subject (Admin / Super Admin)',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'courseId', 'semester'],
              properties: {
                name: { type: 'string', example: 'Operating Systems' },
                code: { type: 'string', example: 'CS-401' },
                courseId: { type: 'string', format: 'uuid' },
                semester: { type: 'integer', example: 4 },
                credits: { type: 'integer', example: 4 }
              }
            }
          }
        }
      },
      responses: {
        201: { description: 'Subject created' },
        403: { description: 'Admin or Super Admin only' }
      }
    }
  },
  '/api/v1/courses': {
    get: {
      tags: ['Curriculum Taxonomy'],
      summary: 'Public course catalog list',
      responses: {
        200: {
          description: 'Active courses list',
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
  '/api/v1/subjects': {
    get: {
      tags: ['Curriculum Taxonomy'],
      summary: 'Public subject catalog list',
      parameters: [
        { name: 'courseId', in: 'query', schema: { type: 'string', format: 'uuid' } },
        { name: 'semester', in: 'query', schema: { type: 'integer' } }
      ],
      responses: {
        200: {
          description: 'Active subjects list',
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
  '/api/v1/categories': {
    get: {
      tags: ['Curriculum Taxonomy'],
      summary: 'Public note category list',
      responses: {
        200: {
          description: 'Active categories list',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'array', items: { $ref: '#/components/schemas/Category' } }
                }
              }
            }
          }
        }
      }
    }
  }
};
