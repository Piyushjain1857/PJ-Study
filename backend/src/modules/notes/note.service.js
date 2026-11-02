import prisma from '../../config/database.js';
import noteRepository from './note.repository.js';
import userRepository from '../users/user.repository.js';
import courseRepository from '../courses/course.repository.js';
import subjectRepository from '../subjects/subject.repository.js';
import topicRepository from '../topics/topic.repository.js';
import { getPaginationParams, buildPaginatedResponse } from '../../utils/pagination.js';
import { assertNoteOwnership } from '../../auth/ownership.js';

const VALID_NOTE_STATUSES = ['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED'];

/**
 * Service encapsulating business rules for Notes, Reviews, and Bookmarks.
 */
export class NoteService {
  /**
   * Retrieves a note by ID with view count tracking.
   *
   * @param {string} id
   * @param {boolean} [trackView=false]
   * @returns {Promise<any>}
   */
  async getNoteById(id, trackView = false) {
    if (!id) {
      const error = new Error('Note ID is required.');
      error.statusCode = 400;
      throw error;
    }

    const note = await noteRepository.findById(id);
    if (!note) {
      const error = new Error(`Note with ID "${id}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    if (trackView) {
      // Non-blocking fire-and-forget view count increment
      noteRepository.incrementViewCount(id).catch((err) => {
        console.error('Failed to increment note view count:', err.message);
      });
    }

    const ratingInfo = await noteRepository.getAverageRating(id);
    return {
      ...note,
      averageRating: ratingInfo.averageRating,
      totalReviews: ratingInfo.totalReviews
    };
  }

  /**
   * Creates a new Note record with relational taxonomy verification.
   *
   * @param {{
   *   title: string,
   *   description?: string,
   *   fileName: string,
   *   storageKey: string,
   *   fileSize: number | bigint,
   *   mimeType?: string,
   *   pageCount?: number,
   *   courseId: string,
   *   subjectId: string,
   *   topicId?: string,
   *   uploadedById: string,
   *   status?: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED'
   * }} input
   * @returns {Promise<any>}
   */
  async createNote(input) {
    const {
      title,
      description,
      fileName,
      storageKey,
      fileSize,
      mimeType = 'application/pdf',
      pageCount,
      courseId,
      subjectId,
      topicId,
      uploadedById,
      status = 'PENDING_REVIEW'
    } = input;

    if (!title || title.trim().length === 0) {
      const error = new Error('Note title is required.');
      error.statusCode = 400;
      throw error;
    }

    if (!fileName || !storageKey) {
      const error = new Error('File name and storage key are required.');
      error.statusCode = 400;
      throw error;
    }

    const size = typeof fileSize === 'bigint' ? fileSize : BigInt(fileSize || 0);
    if (size <= 0n) {
      const error = new Error('File size must be greater than zero bytes.');
      error.statusCode = 400;
      throw error;
    }

    if (!VALID_NOTE_STATUSES.includes(status)) {
      const error = new Error(
        `Invalid status "${status}". Allowed: ${VALID_NOTE_STATUSES.join(', ')}.`
      );
      error.statusCode = 400;
      throw error;
    }

    // Verify all relational references exist
    const [uploader, course, subject] = await Promise.all([
      userRepository.findById(uploadedById),
      courseRepository.findById(courseId),
      subjectRepository.findById(subjectId)
    ]);

    if (!uploader) {
      const error = new Error(`Uploader with ID "${uploadedById}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    if (!course) {
      const error = new Error(`Course with ID "${courseId}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    if (!subject) {
      const error = new Error(`Subject with ID "${subjectId}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    if (subject.courseId !== courseId) {
      const error = new Error(
        `Subject "${subject.name}" does not belong to course "${course.name}".`
      );
      error.statusCode = 400;
      throw error;
    }

    if (topicId) {
      const topic = await topicRepository.findById(topicId);
      if (!topic) {
        const error = new Error(`Topic with ID "${topicId}" was not found.`);
        error.statusCode = 404;
        throw error;
      }
      if (topic.subjectId !== subjectId) {
        const error = new Error(
          `Topic "${topic.name}" does not belong to subject "${subject.name}".`
        );
        error.statusCode = 400;
        throw error;
      }
    }

    return noteRepository.create({
      title: title.trim(),
      description: description?.trim() || null,
      fileName: fileName.trim(),
      storageKey: storageKey.trim(),
      fileSize: size,
      mimeType: mimeType.trim(),
      pageCount: pageCount || null,
      courseId,
      subjectId,
      topicId: topicId || null,
      uploadedById,
      status,
      publishedAt: status === 'APPROVED' ? new Date() : null
    });
  }

  /**
   * Reviews or updates a note status (moderation flow) using a transaction with an audit log.
   *
   * @param {string} noteId
   * @param {'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED'} newStatus
   * @param {string} actorId - Moderator or admin user ID
   * @param {string} [reason]
   * @returns {Promise<any>}
   */
  async updateNoteStatus(noteId, newStatus, actorId, reason) {
    if (!VALID_NOTE_STATUSES.includes(newStatus)) {
      const error = new Error(`Invalid status "${newStatus}".`);
      error.statusCode = 400;
      throw error;
    }

    const note = await noteRepository.findById(noteId);
    if (!note) {
      const error = new Error(`Note with ID "${noteId}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    // Execute status change and audit log entry atomically in a transaction
    return prisma.$transaction(async (tx) => {
      const updatedNote = await tx.note.update({
        where: { id: noteId },
        data: {
          status: newStatus,
          publishedAt: newStatus === 'APPROVED' && !note.publishedAt ? new Date() : note.publishedAt
        }
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'NOTE_STATUS_UPDATE',
          entityType: 'Note',
          entityId: noteId,
          metadata: {
            previousStatus: note.status,
            newStatus,
            reason: reason || 'Moderation decision'
          }
        }
      });

      return updatedNote;
    });
  }

  /**
   * Updates note content with strict ownership verification.
   *
   * @param {string} noteId
   * @param {string} userId
   * @param {string} userRole
   * @param {{ title?: string, description?: string }} data
   * @returns {Promise<any>}
   */
  async updateNote(noteId, userId, userRole, data) {
    const note = await noteRepository.findById(noteId);
    if (!note) {
      const error = new Error(`Note with ID "${noteId}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    assertNoteOwnership(note, userId, userRole);

    const updatePayload = {};
    if (data.title && typeof data.title === 'string' && data.title.trim().length > 0) {
      updatePayload.title = data.title.trim();
    }
    if (data.description !== undefined) {
      updatePayload.description = data.description;
    }

    return noteRepository.update(noteId, updatePayload);
  }

  /**
   * Deletes a note with strict ownership verification.
   *
   * @param {string} noteId
   * @param {string} userId
   * @param {string} userRole
   * @returns {Promise<any>}
   */
  async deleteNote(noteId, userId, userRole) {
    const note = await noteRepository.findById(noteId);
    if (!note) {
      const error = new Error(`Note with ID "${noteId}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    assertNoteOwnership(note, userId, userRole);

    return noteRepository.delete(noteId);
  }

  /**
   * Adds a note to a student's bookmarks library.
   *
   * @param {string} userId
   * @param {string} noteId
   * @returns {Promise<{ bookmarked: boolean }>}
   */
  async bookmarkNote(userId, noteId) {
    const note = await noteRepository.findById(noteId);
    if (!note) {
      const error = new Error(`Note with ID "${noteId}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    const existing = await noteRepository.findBookmark(userId, noteId);
    if (existing) {
      return { bookmarked: true, message: 'Note is already bookmarked.' };
    }

    await noteRepository.createBookmark(userId, noteId);
    return { bookmarked: true, message: 'Note bookmarked successfully.' };
  }

  /**
   * Removes a note from bookmarks.
   *
   * @param {string} userId
   * @param {string} noteId
   * @returns {Promise<{ bookmarked: boolean }>}
   */
  async removeBookmark(userId, noteId) {
    try {
      await noteRepository.deleteBookmark(userId, noteId);
      return { bookmarked: false, message: 'Bookmark removed.' };
    } catch {
      return { bookmarked: false, message: 'Bookmark not found.' };
    }
  }

  /**
   * Submits or updates a note review with rating invariant validation (1 to 5).
   *
   * @param {string} userId
   * @param {string} noteId
   * @param {number} rating
   * @param {string} [comment]
   * @returns {Promise<any>}
   */
  async reviewNote(userId, noteId, rating, comment) {
    const parsedRating = parseInt(String(rating), 10);
    if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      const error = new Error('Rating must be an integer between 1 and 5.');
      error.statusCode = 400;
      throw error;
    }

    const note = await noteRepository.findById(noteId);
    if (!note) {
      const error = new Error(`Note with ID "${noteId}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    if (note.uploadedById === userId) {
      const error = new Error('Authors are not permitted to review their own uploaded notes.');
      error.statusCode = 403;
      throw error;
    }

    return noteRepository.upsertReview(userId, noteId, parsedRating, comment);
  }

  /**
   * Lists published notes with pagination, search, and course/subject filtering.
   * Enforces public visibility invariant (status === 'APPROVED').
   *
   * @param {{
   *   page?: string | number,
   *   limit?: string | number,
   *   courseId?: string,
   *   subjectId?: string,
   *   topicId?: string,
   *   search?: string,
   *   status?: string
   * }} query
   * @param {boolean} [isPublic=true] - If true, strictly restricts to APPROVED notes
   * @returns {Promise<any>}
   */
  async listNotes(query = {}, isPublic = true) {
    const pagination = getPaginationParams(query);
    const where = {};

    if (isPublic) {
      where.status = 'APPROVED';
    } else if (query.status && VALID_NOTE_STATUSES.includes(query.status)) {
      where.status = query.status;
    }

    if (query.courseId) where.courseId = query.courseId;
    if (query.subjectId) where.subjectId = query.subjectId;
    if (query.topicId) where.topicId = query.topicId;

    if (query.search && query.search.trim().length > 0) {
      where.title = { contains: query.search.trim() };
    }

    const [items, totalItems] = await Promise.all([
      noteRepository.findMany({
        skip: pagination.skip,
        take: pagination.take,
        where,
        orderBy: { createdAt: 'desc' }
      }),
      noteRepository.count(where)
    ]);

    // Format BigInt fields for JSON serialization
    const sanitizedItems = items.map((item) => ({
      ...item,
      fileSize: typeof item.fileSize === 'bigint' ? item.fileSize.toString() : item.fileSize
    }));

    return buildPaginatedResponse(sanitizedItems, totalItems, pagination);
  }
}

export const noteService = new NoteService();
export default noteService;
