import noteService, { NoteService } from './note.service.js';
import storageService from '../../services/storage/storage.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

/**
 * Controller handling HTTP requests for Notes management, uploads, and moderation.
 */
export class NoteController {
  constructor(service = noteService, storage = storageService) {
    this.service = service;
    this.storage = storage;
  }

  /**
   * Lists approved notes for the public library.
   */
  listNotes = async (req, res, next) => {
    try {
      const notes = await this.service.listNotes(req.query);
      return sendSuccess(res, notes);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Retrieves single note by ID with draft isolation check.
   */
  getNoteById = async (req, res, next) => {
    try {
      const note = await this.service.getNoteById(req.params.id, req.user || null, true);
      return sendSuccess(res, note);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Creates a new note manuscript with optional file upload.
   */
  createNote = async (req, res, next) => {
    try {
      const payload = { ...req.body, uploadedById: req.user.id };

      // Handle optional uploaded file
      if (req.file) {
        const stored = await this.storage.saveFile(req.file);
        payload.fileName = stored.fileName;
        payload.storageKey = stored.storageKey;
        payload.fileSize = stored.fileSize;
        payload.mimeType = stored.mimeType;
      }

      // Handle action shortcuts (e.g. action: 'submit' -> status: 'PENDING')
      if (req.body.action === 'submit') {
        payload.status = 'PENDING';
      }

      const note = await this.service.createNote(payload);
      return sendSuccess(res, note, 201, 'Note created successfully.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Updates note details with optional replacement file.
   */
  updateNote = async (req, res, next) => {
    try {
      const updateData = { ...req.body };

      if (req.file) {
        const stored = await this.storage.saveFile(req.file);
        updateData.fileName = stored.fileName;
        updateData.storageKey = stored.storageKey;
        updateData.fileSize = stored.fileSize;
        updateData.mimeType = stored.mimeType;
      }

      const updated = await this.service.updateNote(
        req.params.id,
        req.user.id,
        req.user.role,
        updateData
      );
      return sendSuccess(res, updated, 200, 'Note updated successfully.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Deletes a note.
   */
  deleteNote = async (req, res, next) => {
    try {
      await this.service.deleteNote(req.params.id, req.user.id, req.user.role);
      return sendSuccess(res, null, 200, 'Note deleted successfully.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Submits a DRAFT or REJECTED note for review.
   */
  submitNote = async (req, res, next) => {
    try {
      const updated = await this.service.submitForReview(req.params.id, req.user.id, req.user.role);
      return sendSuccess(res, updated, 200, 'Note submitted for moderation review.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Archives an approved note.
   */
  archiveNote = async (req, res, next) => {
    try {
      const updated = await this.service.archiveNote(req.params.id, req.user.id, req.user.role);
      return sendSuccess(res, updated, 200, 'Note archived successfully.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Reviews and approves or rejects a note submission (moderator/admin).
   */
  reviewNote = async (req, res, next) => {
    try {
      const { status, reason } = req.body;
      const updated = await this.service.reviewNoteSubmission(
        req.params.id,
        status,
        req.user.id,
        reason
      );
      return sendSuccess(res, updated, 200, `Note status updated to ${status}.`);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Lists notes created by the authenticated user.
   */
  getMyNotes = async (req, res, next) => {
    try {
      const notes = await this.service.getUserNotes(req.user.id, req.query);
      return sendSuccess(res, notes);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Lists pending notes in moderation queue for staff.
   */
  getModerationQueue = async (req, res, next) => {
    try {
      const queue = await this.service.getModerationQueue(req.query);
      return sendSuccess(res, queue);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Securely streams note file for download or browser preview.
   */
  downloadFile = async (req, res, next) => {
    try {
      const { stream, fileName, mimeType, size } = await this.service.getNoteFileForDownload(
        req.params.id,
        req.user || null
      );

      const isInline = req.query.inline === 'true';
      const disposition = isInline ? 'inline' : 'attachment';

      res.setHeader('Content-Type', mimeType);
      res.setHeader(
        'Content-Disposition',
        `${disposition}; filename="${encodeURIComponent(fileName)}"`
      );
      if (size) {
        res.setHeader('Content-Length', size);
      }

      stream.pipe(res);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Bookmarks a note.
   */
  bookmarkNote = async (req, res, next) => {
    try {
      const result = await this.service.bookmarkNote(req.user.id, req.params.id);
      return sendSuccess(res, result);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Removes bookmark.
   */
  removeBookmark = async (req, res, next) => {
    try {
      const result = await this.service.removeBookmark(req.user.id, req.params.id);
      return sendSuccess(res, result);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Rates and reviews note.
   */
  reviewNoteRating = async (req, res, next) => {
    try {
      const { rating, comment } = req.body;
      const review = await this.service.reviewNote(req.user.id, req.params.id, rating, comment);
      return sendSuccess(res, review, 200, 'Review submitted successfully.');
    } catch (err) {
      return next(err);
    }
  };
}

export const noteController = new NoteController();
export default noteController;
