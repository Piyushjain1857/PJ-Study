/**
 * Study Notes and Manuscript Schemas
 */
export const noteSchemas = {
  Note: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', example: 'f0279325-92f7-48a1-8beb-86c70fb446c5' },
      title: { type: 'string', example: 'Data Structures & Algorithms in C++' },
      slug: { type: 'string', example: 'data-structures-and-algorithms-in-c-88b12f' },
      description: { type: 'string', nullable: true, example: 'Comprehensive Unit 1-4 lecture notes.' },
      content: { type: 'string', nullable: true, example: '# Chapter 1: Big-O Time Complexity...' },
      fileName: { type: 'string', nullable: true, example: 'dsa_lecture_notes.pdf' },
      storageProvider: { type: 'string', enum: ['local', 'google_drive'], example: 'google_drive' },
      fileSize: { type: 'string', nullable: true, example: '1048576' },
      mimeType: { type: 'string', nullable: true, example: 'application/pdf' },
      semester: { type: 'integer', example: 3 },
      academicYear: { type: 'string', nullable: true, example: '2026-2027' },
      status: {
        type: 'string',
        enum: ['DRAFT', 'PENDING', 'APPROVED', 'PUBLISHED', 'REJECTED', 'ARCHIVED'],
        example: 'PUBLISHED'
      },
      rejectionReason: { type: 'string', nullable: true },
      viewCount: { type: 'integer', example: 142 },
      downloadCount: { type: 'integer', example: 38 },
      averageRating: { type: 'number', example: 4.8 },
      totalReviews: { type: 'integer', example: 12 },
      course: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'B.Tech' },
          slug: { type: 'string', example: 'b-tech' }
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
      category: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Lecture Notes' },
          slug: { type: 'string', example: 'lecture-notes' }
        }
      },
      uploadedBy: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Platform Admin' },
          role: { type: 'string', example: 'ADMIN' },
          avatarUrl: { type: 'string', nullable: true }
        }
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      publishedAt: { type: 'string', format: 'date-time', nullable: true }
    }
  },
  CreateNoteRequest: {
    type: 'object',
    required: ['title', 'subjectId'],
    properties: {
      title: { type: 'string', minLength: 3, maxLength: 200, example: 'Operating Systems Virtual Memory' },
      description: { type: 'string', maxLength: 2000, example: 'Detailed coverage of page replacement algorithms.' },
      content: { type: 'string', example: '# Unit 3: Virtual Memory Management...' },
      subjectId: { type: 'string', format: 'uuid', example: '00c5ed7e-b79c-4178-ad3a-2b31332f6f32' },
      courseId: { type: 'string', format: 'uuid', nullable: true },
      categoryId: { type: 'string', format: 'uuid', nullable: true },
      semester: { type: 'integer', minimum: 1, maximum: 12, example: 4 },
      file: {
        type: 'string',
        format: 'binary',
        description: 'Optional attached academic manuscript (PDF, DOCX, PPTX, XLSX, TXT, PNG, JPG). Max 50MB.'
      }
    }
  },
  NoteRatingSummary: {
    type: 'object',
    properties: {
      noteId: { type: 'string', format: 'uuid' },
      averageRating: { type: 'number', example: 4.8 },
      totalReviews: { type: 'integer', example: 12 },
      distribution: {
        type: 'object',
        properties: {
          1: { type: 'integer', example: 0 },
          2: { type: 'integer', example: 0 },
          3: { type: 'integer', example: 1 },
          4: { type: 'integer', example: 2 },
          5: { type: 'integer', example: 9 }
        }
      }
    }
  }
};
