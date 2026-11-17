/**
 * Curriculum and Academic Hierarchy Schemas
 */
export const academicSchemas = {
  University: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', example: 'eef5ab2c-4e3c-4134-a214-30288a86b8ee' },
      name: { type: 'string', example: 'K.R. Mangalam University' },
      shortName: { type: 'string', example: 'KRMU' },
      slug: { type: 'string', example: 'krmu' },
      isActive: { type: 'boolean', example: true },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  School: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', example: 'd29047b7-9468-47c6-abf1-6a3408424ce2' },
      name: { type: 'string', example: 'School of Engineering & Technology' },
      slug: { type: 'string', example: 'soet' },
      universityId: { type: 'string', format: 'uuid' },
      isActive: { type: 'boolean', example: true }
    }
  },
  Course: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', example: '7a5249b8-89fd-4de9-8cd5-e69059c06568' },
      name: { type: 'string', example: 'B.Tech' },
      code: { type: 'string', example: 'B.TECH' },
      slug: { type: 'string', example: 'b-tech' },
      semestersCount: { type: 'integer', example: 8 },
      degreeLevel: { type: 'string', example: 'Undergraduate' },
      schoolId: { type: 'string', format: 'uuid', nullable: true },
      isActive: { type: 'boolean', example: true }
    }
  },
  Subject: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', example: '00c5ed7e-b79c-4178-ad3a-2b31332f6f32' },
      name: { type: 'string', example: 'Basics of Electronics & Digital Logic Design' },
      code: { type: 'string', example: 'ECE-DLD101' },
      slug: { type: 'string', example: 'electronics-digital-logic' },
      semester: { type: 'integer', example: 1 },
      credits: { type: 'integer', example: 4, nullable: true },
      courseId: { type: 'string', format: 'uuid' },
      isActive: { type: 'boolean', example: true }
    }
  },
  Category: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', example: '9f01559f-1b32-4c79-bd88-74a76f2496ea' },
      name: { type: 'string', example: 'Lecture Notes' },
      slug: { type: 'string', example: 'lecture-notes' },
      description: { type: 'string', nullable: true, example: 'Faculty syllabus lectures and slide transcriptions.' },
      isActive: { type: 'boolean', example: true }
    }
  }
};
