/**
 * Authentication and User Entity Schemas
 */
export const authSchemas = {
  User: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid', example: '1c500b12-2100-41dc-9246-10aee8cfaacd' },
      name: { type: 'string', example: 'Alex Rivera' },
      email: { type: 'string', format: 'email', example: 'scholar@pjstudy.com' },
      role: {
        type: 'string',
        enum: ['STUDENT', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'],
        example: 'STUDENT',
        description: 'STUDENT (Scholar), MODERATOR, ADMIN, or SUPER_ADMIN'
      },
      universityId: { type: 'string', format: 'uuid', nullable: true },
      schoolId: { type: 'string', format: 'uuid', nullable: true },
      courseId: { type: 'string', format: 'uuid', nullable: true },
      semester: { type: 'integer', example: 4, nullable: true },
      academicYear: { type: 'string', example: '2026-2027', nullable: true },
      isEmailVerified: { type: 'boolean', example: true },
      avatarUrl: { type: 'string', nullable: true, example: null },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  AuthTokens: {
    type: 'object',
    properties: {
      user: { $ref: '#/components/schemas/User' },
      accessToken: {
        type: 'string',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        description: 'Signed JWT Bearer access token valid for 15 minutes.'
      }
    }
  },
  RegisterRequest: {
    type: 'object',
    required: ['name', 'email', 'password'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 80, example: 'Alex Rivera' },
      email: { type: 'string', format: 'email', example: 'alex@pjstudy.com' },
      password: {
        type: 'string',
        format: 'password',
        minLength: 8,
        example: 'StrongP@ssw0rd2026!',
        description: 'Requires min 8 characters, at least 1 uppercase, 1 lowercase, 1 digit, and 1 symbol.'
      },
      courseId: { type: 'string', format: 'uuid', nullable: true },
      semester: { type: 'integer', minimum: 1, maximum: 12, example: 4, nullable: true }
    }
  },
  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email', example: 'student@portal.com' },
      password: { type: 'string', format: 'password', example: 'Student@123' }
    }
  },
  ChangePasswordRequest: {
    type: 'object',
    required: ['currentPassword', 'newPassword'],
    properties: {
      currentPassword: { type: 'string', format: 'password', example: 'CurrentSecret123!' },
      newPassword: { type: 'string', format: 'password', minLength: 8, example: 'NewSecret456!' }
    }
  },
  ForgotPasswordRequest: {
    type: 'object',
    required: ['email'],
    properties: {
      email: { type: 'string', format: 'email', example: 'scholar@pjstudy.com' }
    }
  },
  ResetPasswordRequest: {
    type: 'object',
    required: ['token', 'newPassword'],
    properties: {
      token: { type: 'string', example: '5bdbda4fe92a563d2830872bb2cb9bec5b3d5937af2722a236e9461d72cd534a' },
      newPassword: { type: 'string', format: 'password', minLength: 8, example: 'NewStrongPassword789!' }
    }
  }
};
