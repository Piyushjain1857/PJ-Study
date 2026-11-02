import { sendError } from '../../utils/apiResponse.js';
import { ROLES } from '../../auth/rolePermissions.js';

/**
 * Validates user profile or status update payload.
 */
export function validateUpdateUser(req, res, next) {
  const { name, bio, isActive } = req.body || {};
  const errors = [];

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length < 2) {
      errors.push('Name must be at least 2 characters long.');
    } else if (name.trim().length > 100) {
      errors.push('Name cannot exceed 100 characters.');
    }
  }

  if (bio !== undefined && bio !== null && typeof bio !== 'string') {
    errors.push('Bio must be a valid text string or null.');
  }

  if (isActive !== undefined && typeof isActive !== 'boolean') {
    errors.push('isActive must be a boolean value (true or false).');
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for user update.', 422, 'VALIDATION_ERROR', errors);
  }

  next();
}

/**
 * Validates role change payload.
 */
export function validateChangeRole(req, res, next) {
  const { role, reason } = req.body || {};
  const errors = [];

  if (!role || typeof role !== 'string') {
    errors.push('A valid role is required.');
  } else if (!Object.values(ROLES).includes(role.toUpperCase().trim())) {
    errors.push(`Role must be one of: ${Object.values(ROLES).join(', ')}.`);
  }

  if (reason !== undefined && typeof reason !== 'string') {
    errors.push('Reason must be a string.');
  }

  if (errors.length > 0) {
    return sendError(res, 'Validation failed for role change.', 422, 'VALIDATION_ERROR', errors);
  }

  req.body.role = role.toUpperCase().trim();
  next();
}

