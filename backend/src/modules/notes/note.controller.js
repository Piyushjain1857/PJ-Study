import noteService, { NoteService } from './note.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

/**
 * Controller handling HTTP requests for Notes management, reviews, and moderation.
 */
export class NoteController {
  /**
   * @param {NoteService} [service=noteService]
   */
  constructor(service = noteService) {
    this.service = service;
  }

  /**
   * Lists published notes or all notes for moderators/admins.
   */
  listNotes = async (req, res, next) => {
    try {
      const isPublic = !req.user || req.user.role === 'STUDENT';
      const notes = await this.service.listNotes(req.query, isPublic);
      return sendSuccess(res, notes);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Retrieves single note by ID.
   */
  getNoteById = async (req, res, next) => {
    try {
      const note = await this.service.getNoteById(req.params.id, true);
      return sendSuccess(res, note);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Creates a new personal note manuscript.
   */
  createNote = async (req, res, next) => {
    try {
      const note = await this.service.createNote({
        ...req.body,
        uploadedById: req.user.id
      });
      return sendSuccess(res, note, 201, 'Note created successfully.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Updates note details with ownership verification.
   */
  updateNote = async (req, res, next) => {
    try {
      const updated = await this.service.updateNote(
        req.params.id,
        req.user.id,
        req.user.role,
        req.body
      );
      return sendSuccess(res, updated, 200, 'Note updated successfully.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Deletes a note with ownership verification.
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
   * Reviews and approves or rejects a note submission.
   */
  reviewNote = async (req, res, next) => {
    try {
      const { status, reason } = req.body;
      const updated = await this.service.updateNoteStatus(
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
}

export const noteController = new NoteController();
export default noteController;
