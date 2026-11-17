/**
 * Authentication and Lifecycle Paths
 */
export const authPaths = {
  '/api/v1/auth/register': {
    post: {
      tags: ['Authentication'],
      summary: 'Register a new scholar account',
      description: 'Registers a new student account. Role is strictly assigned as STUDENT. Sends email verification token.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/RegisterRequest' }
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
  '/api/v1/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'Authenticate with email & password',
      description: 'Authenticates user and returns profile and signed JWT access token. Also sets HttpOnly session cookie.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LoginRequest' }
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
                  data: { $ref: '#/components/schemas/AuthTokens' }
                }
              }
            }
          }
        },
        401: { description: 'Invalid email or password' }
      }
    }
  },
  '/api/v1/auth/logout': {
    post: {
      tags: ['Authentication'],
      summary: 'Logout and terminate active session',
      description: 'Clears the HttpOnly session refresh cookie.',
      responses: {
        200: {
          description: 'Logged out successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/StandardResponse' }
            }
          }
        }
      }
    }
  },
  '/api/v1/auth/me': {
    get: {
      tags: ['Authentication'],
      summary: 'Get current authenticated user session',
      description: 'Returns profile of current user decoded from Bearer JWT or session cookie.',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      responses: {
        200: {
          description: 'Active session user profile',
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
  '/api/v1/auth/refresh': {
    post: {
      tags: ['Authentication'],
      summary: 'Refresh expired access token',
      description: 'Generates a fresh 15-minute access token using the valid session refresh cookie.',
      responses: {
        200: {
          description: 'Token refreshed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1Ni...' }
                    }
                  }
                }
              }
            }
          }
        },
        401: { description: 'Invalid or expired refresh token' }
      }
    }
  },
  '/api/v1/auth/verify-email': {
    get: {
      tags: ['Authentication'],
      summary: 'Verify email via query token',
      parameters: [{ name: 'token', in: 'query', required: true, schema: { type: 'string' } }],
      responses: {
        200: { description: 'Email address successfully verified' },
        400: { description: 'Invalid or expired verification token' }
      }
    },
    post: {
      tags: ['Authentication'],
      summary: 'Verify email via JSON token body',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['token'],
              properties: { token: { type: 'string' } }
            }
          }
        }
      },
      responses: {
        200: { description: 'Email address successfully verified' },
        400: { description: 'Invalid or expired verification token' }
      }
    }
  },
  '/api/v1/auth/resend-verification': {
    post: {
      tags: ['Authentication'],
      summary: 'Resend email verification link',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email'],
              properties: { email: { type: 'string', format: 'email' } }
            }
          }
        }
      },
      responses: {
        200: { description: 'Verification email resent if account exists' }
      }
    }
  },
  '/api/v1/auth/forgot-password': {
    post: {
      tags: ['Authentication'],
      summary: 'Request password reset token',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ForgotPasswordRequest' }
          }
        }
      },
      responses: {
        200: { description: 'Password reset link dispatched if email is registered' }
      }
    }
  },
  '/api/v1/auth/reset-password': {
    post: {
      tags: ['Authentication'],
      summary: 'Reset password with token',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ResetPasswordRequest' }
          }
        }
      },
      responses: {
        200: { description: 'Password reset successful' },
        400: { description: 'Invalid or expired reset token' }
      }
    }
  },
  '/api/v1/auth/change-password': {
    post: {
      tags: ['Authentication'],
      summary: 'Change password for authenticated user',
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ChangePasswordRequest' }
          }
        }
      },
      responses: {
        200: { description: 'Password changed successfully' },
        401: { description: 'Current password incorrect or session invalid' }
      }
    }
  }
};
