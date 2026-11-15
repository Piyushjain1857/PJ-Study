import { sendError } from '../../utils/apiResponse.js';

const FORBIDDEN_PROFILE_FIELDS = new Set([
  'role',
  'isEmailVerified',
  'is_email_verified',
  'isActive',
  'is_active',
  'id',
  'email',
  'password',
  'passwordHash',
  'password_hash',
  'createdAt',
  'created_at',
  'updatedAt',
  'updated_at'
]);

/**
 * Validates updates to a user's own profile.
 * Rejects any attempt to tamper with restricted administrative, authentication, or identity fields.
 */
export function validateUpdateProfile(req, res, next) {
  const body = req.body || {};

  // 1. Strict forbidden fields check
  for (const field of Object.keys(body)) {
    if (FORBIDDEN_PROFILE_FIELDS.has(field)) {
      return sendError(
        res,
        `Modification of restricted field "${field}" is strictly prohibited.`,
        403,
        'FORBIDDEN_FIELD_MODIFICATION'
      );
    }
  }

  // 2. Name validation
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length < 2) {
      return sendError(
        res,
        'Display name must be at least 2 characters long.',
        400,
        'INVALID_DISPLAY_NAME'
      );
    }
    if (body.name.trim().length > 120) {
      return sendError(
        res,
        'Display name cannot exceed 120 characters.',
        400,
        'INVALID_DISPLAY_NAME'
      );
    }
  }

  // 3. Bio validation
  if (body.bio !== undefined && body.bio !== null) {
    if (typeof body.bio !== 'string') {
      return sendError(res, 'Biography must be a string.', 400, 'INVALID_BIO');
    }
    if (body.bio.trim().length > 300) {
      return sendError(
        res,
        'Biography cannot exceed 300 characters.',
        400,
        'BIO_EXCEEDS_MAX_LENGTH'
      );
    }
  }

  // 4. University validation
  if (body.university !== undefined && body.university !== null) {
    if (typeof body.university !== 'string') {
      return sendError(res, 'University must be a string.', 400, 'INVALID_UNIVERSITY');
    }
    if (body.university.trim().length > 150) {
      return sendError(
        res,
        'University name cannot exceed 150 characters.',
        400,
        'INVALID_UNIVERSITY'
      );
    }
  }

  // 5. Semester validation
  if (body.semester !== undefined && body.semester !== null && body.semester !== '') {
    const sem = Number(body.semester);
    if (!Number.isInteger(sem) || sem < 1 || sem > 12) {
      return sendError(
        res,
        'Semester must be an integer between 1 and 12.',
        400,
        'INVALID_SEMESTER'
      );
    }
  }

  // 6. Course ID validation
  if (body.courseId !== undefined && body.courseId !== null && body.courseId !== '') {
    if (typeof body.courseId !== 'string') {
      return sendError(res, 'Invalid course identifier format.', 400, 'INVALID_COURSE_ID');
    }
  }

  return next();
}

/**
 * Validates updates to profile privacy configuration toggles.
 */
export function validatePrivacySettings(req, res, next) {
  const body = req.body || {};

  const allowedKeys = [
    'publicProfileEnabled',
    'showAcademicInfo',
    'showBio',
    'showContributionStats'
  ];

  for (const key of Object.keys(body)) {
    if (!allowedKeys.includes(key)) {
      return sendError(
        res,
        `Unexpected privacy configuration parameter "${key}".`,
        400,
        'INVALID_PRIVACY_SETTING'
      );
    }
    if (typeof body[key] !== 'boolean') {
      return sendError(
        res,
        `Privacy parameter "${key}" must be a boolean (true or false).`,
        400,
        'INVALID_BOOLEAN_VALUE'
      );
    }
  }

  return next();
}
