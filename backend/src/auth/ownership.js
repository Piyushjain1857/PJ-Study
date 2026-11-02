import noteRepository from '../modules/notes/note.repository.js';
import { ROLES } from './rolePermissions.js';
import { sendError } from '../utils/apiResponse.js';

/**
 * Asserts ownership or administrative rights over a specific Note resource.
 *
 * @param {object} note - The retrieved note record
 * @param {string} userId - Authenticated user ID
 * @param {string} userRole - Authenticated user role
 * @returns {boolean} True if authorized, throws Error otherwise
 */
export function assertNoteOwnership(note, userId, userRole) {
  if (!note) {
    const error = new Error('Study note was not found.');
    error.statusCode = 404;
    error.code = 'NOTE_NOT_FOUND';
    throw error;
  }

  // Super Admins and Admins have administrative oversight
  if (userRole === ROLES.SUPER_ADMIN || userRole === ROLES.ADMIN) {
    return true;
  }

  // The uploader is the authoritative owner
  if (note.uploadedById === userId) {
    return true;
  }

  const error = new Error(
    'Access denied: you do not have permission to modify or delete another scholar’s notes.'
  );
  error.statusCode = 403;
  error.code = 'FORBIDDEN_OWNERSHIP';
  throw error;
}

/**
 * Express middleware verifying that the current authenticated user owns
 * the requested note, or possesses administrative permissions.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function requireNoteOwnership(req, res, next) {
  try {
    const noteId = req.params.id || req.params.noteId;
    if (!noteId) {
      return sendError(res, 'Note identifier is required.', 400, 'BAD_REQUEST');
    }

    const note = await noteRepository.findById(noteId);
    if (!note) {
      return sendError(res, 'Study note was not found.', 404, 'NOTE_NOT_FOUND');
    }

    assertNoteOwnership(note, req.user.id, req.user.role);
    req.note = note;
    next();
  } catch (err) {
    return sendError(res, err.message, err.statusCode || 403, err.code || 'FORBIDDEN');
  }
}

