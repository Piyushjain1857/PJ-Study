import crypto from 'crypto';
import prisma from '../../config/database.js';
import noteRepository, { NoteRepository } from './note.repository.js';
import userRepository from '../users/user.repository.js';
import courseRepository from '../courses/course.repository.js';
import subjectRepository from '../subjects/subject.repository.js';
import topicRepository from '../topics/topic.repository.js';
import categoryRepository from '../categories/category.repository.js';
import storageService from '../../services/storage/storage.service.js';
import { slugify } from '../courses/course.service.js';
import { getPaginationParams, buildPaginatedResponse } from '../../utils/pagination.js';
import { assertNoteOwnership } from '../../auth/ownership.js';
import { ROLES } from '../../auth/rolePermissions.js';

export const VALID_NOTE_STATUSES = [
  'DRAFT',
  'PENDING',
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
  'ARCHIVED'
];

/**
 * Normalizes input status strings so 'PENDING' and 'PENDING_REVIEW' are handled interchangeably.
 *
 * @param {string} status
 * @returns {string}
 */
export function normalizeStatus(status) {
  if (!status) return 'DRAFT';
  const upper = String(status).toUpperCase();
  if (upper === 'PENDING') return 'PENDING_REVIEW';
  return upper;
}

/**
 * Formats note records for JSON responses, converting BigInt fileSize to string/number.
 *
 * @param {object} item
 * @returns {object}
 */
export function sanitizeNote(item) {
  if (!item) return null;
  return {
    ...item,
    fileSize: typeof item.fileSize === 'bigint' ? item.fileSize.toString() : item.fileSize,
    // Present normalized status alias for client consistency
    statusAlias: item.status === 'PENDING_REVIEW' ? 'PENDING' : item.status
  };
}

/**
 * Service encapsulating business rules for Notes, Reviews, Bookmarks, and Moderation.
 */
export class NoteService {
  constructor(repo = noteRepository, storage = storageService) {
    this.repo = repo;
    this.storage = storage;
  }

  /**
   * Retrieves a note by ID with view tracking and draft security isolation.
   *
   * @param {string} id
   * @param {object|null} currentUser
   * @param {boolean} [trackView=false]
   * @returns {Promise<any>}
   */
  async getNoteById(id, currentUser = null, trackView = false) {
    if (!id) {
      const error = new Error('Note ID is required.');
      error.statusCode = 400;
      throw error;
    }

    const note = await this.repo.findById(id);
    if (!note) {
      const error = new Error(`Note with ID "${id}" was not found.`);
      error.statusCode = 404;
      error.code = 'NOTE_NOT_FOUND';
      throw error;
    }

    // Security check: Private drafts, pending, and rejected notes are accessible ONLY to the author or staff
    const isPubliclyVisible = note.status === 'APPROVED';
    if (!isPubliclyVisible) {
      const isOwner = currentUser && note.uploadedById === currentUser.id;
      const isStaff =
        currentUser &&
        (currentUser.role === ROLES.MODERATOR ||
          currentUser.role === ROLES.ADMIN ||
          currentUser.role === ROLES.SUPER_ADMIN);

      if (!isOwner && !isStaff) {
        const error = new Error(
          'This study note manuscript is private or pending moderation review.'
        );
        error.statusCode = 403;
        error.code = 'NOTE_ACCESS_FORBIDDEN';
        throw error;
      }
    }

    if (trackView && isPubliclyVisible) {
      this.repo.incrementViewCount(id).catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Failed to increment note view count:', err.message);
      });
    }

    const ratingInfo = await this.repo.getAverageRating(id);
    return sanitizeNote({
      ...note,
      averageRating: ratingInfo.averageRating,
      totalReviews: ratingInfo.totalReviews
    });
  }

  /**
   * Creates a new Note record with relational taxonomy verification and file handling.
   *
   * @param {{
   *   title: string,
   *   description?: string,
   *   content?: string,
   *   subjectId: string,
   *   courseId?: string,
   *   categoryId?: string,
   *   semester?: number,
   *   academicYear?: string,
   *   topicId?: string,
   *   uploadedById: string,
   *   status?: string,
   *   fileName?: string,
   *   storageKey?: string,
   *   fileSize?: number | bigint,
   *   mimeType?: string
   * }} input
   * @returns {Promise<any>}
   */
  async createNote(input) {
    const {
      title,
      description,
      content,
      subjectId,
      courseId: explicitCourseId,
      categoryId,
      semester: explicitSemester,
      academicYear,
      topicId,
      uploadedById,
      status: requestedStatus = 'DRAFT',
      fileName,
      storageKey,
      fileSize,
      mimeType
    } = input;

    // 1. Title validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      const error = new Error('Note title is required.');
      error.statusCode = 400;
      error.code = 'TITLE_REQUIRED';
      throw error;
    }

    // 2. Content or file validation
    const hasContent = content && content.trim().length > 0;
    const hasFile = fileName && storageKey;

    if (!hasContent && !hasFile) {
      const error = new Error(
        'Please provide either written study note content or upload an educational document file.'
      );
      error.statusCode = 400;
      error.code = 'NOTE_PAYLOAD_EMPTY';
      throw error;
    }

    let size = null;
    if (hasFile) {
      size = typeof fileSize === 'bigint' ? fileSize : BigInt(fileSize || 0);
      if (size <= 0n) {
        const error = new Error('File size must be greater than zero bytes.');
        error.statusCode = 400;
        error.code = 'INVALID_FILE_SIZE';
        throw error;
      }
    }

    // 3. Status invariant: Users cannot directly publish as APPROVED
    const normalized = normalizeStatus(requestedStatus);
    if (!VALID_NOTE_STATUSES.includes(normalized)) {
      const error = new Error(`Invalid status "${requestedStatus}". Allowed: DRAFT, PENDING.`);
      error.statusCode = 400;
      throw error;
    }

    if (normalized === 'APPROVED') {
      const error = new Error(
        'Notes cannot be published directly. Notes must be saved as DRAFT or submitted for moderator review.'
      );
      error.statusCode = 403;
      error.code = 'UNAUTHORIZED_PUBLISH';
      throw error;
    }

    // 4. Verify relational references
    if (!subjectId) {
      const error = new Error('Subject is required for categorizing study notes.');
      error.statusCode = 400;
      throw error;
    }

    const [uploader, subject] = await Promise.all([
      userRepository.findById(uploadedById),
      subjectRepository.findById(subjectId)
    ]);

    if (!uploader) {
      const error = new Error(`Uploader with ID "${uploadedById}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    if (!subject) {
      const error = new Error(`Subject with ID "${subjectId}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    const courseId = explicitCourseId || subject.courseId;
    if (explicitCourseId && explicitCourseId !== subject.courseId) {
      const error = new Error(`Subject does not belong to the selected course.`);
      error.statusCode = 400;
      throw error;
    }

    // Verify category if provided
    if (categoryId) {
      const category = await categoryRepository.findById(categoryId);
      if (!category) {
        const error = new Error(`Category with ID "${categoryId}" was not found.`);
        error.statusCode = 404;
        throw error;
      }
    }

    // Verify topic if provided
    if (topicId) {
      const topic = await topicRepository.findById(topicId);
      if (!topic) {
        const error = new Error(`Topic with ID "${topicId}" was not found.`);
        error.statusCode = 404;
        throw error;
      }
      if (topic.subjectId !== subjectId) {
        const error = new Error(`Topic does not belong to the selected subject.`);
        error.statusCode = 400;
        throw error;
      }
    }

    // Generate unique slug
    const shortId = crypto.randomBytes(4).toString('hex');
    const slug = `${slugify(title.trim())}-${shortId}`;
    const semester = explicitSemester || subject.semester || 1;

    const note = await this.repo.create({
      title: title.trim(),
      slug,
      description: description?.trim() || null,
      content: content?.trim() || null,
      fileName: fileName?.trim() || null,
      storageKey: storageKey?.trim() || null,
      fileSize: size,
      mimeType: mimeType?.trim() || (hasFile ? 'application/pdf' : null),
      courseId,
      subjectId,
      categoryId: categoryId || null,
      topicId: topicId || null,
      semester,
      academicYear: academicYear?.trim() || null,
      uploadedById,
      status: normalized,
      publishedAt: null
    });

    return sanitizeNote(note);
  }

  /**
   * Updates an existing note with strict state and ownership verification.
   *
   * @param {string} noteId
   * @param {string} userId
   * @param {string} userRole
   * @param {object} data
   * @returns {Promise<any>}
   */
  async updateNote(noteId, userId, userRole, data) {
    const note = await this.repo.findById(noteId);
    if (!note) {
      const error = new Error(`Note with ID "${noteId}" was not found.`);
      error.statusCode = 404;
      error.code = 'NOTE_NOT_FOUND';
      throw error;
    }

    // Ownership check
    assertNoteOwnership(note, userId, userRole);

    const isStaff = userRole === ROLES.ADMIN || userRole === ROLES.SUPER_ADMIN;

    // Invariant: Non-staff can only edit DRAFT or REJECTED notes
    if (!isStaff && !['DRAFT', 'REJECTED'].includes(note.status)) {
      const error = new Error(
        `Notes with status "${note.status}" cannot be edited. Only DRAFT or REJECTED notes can be modified.`
      );
      error.statusCode = 403;
      error.code = 'NOTE_EDIT_LOCKED';
      throw error;
    }

    const updatePayload = {};

    if (data.title && typeof data.title === 'string' && data.title.trim().length > 0) {
      updatePayload.title = data.title.trim();
    }
    if (data.description !== undefined) {
      updatePayload.description = data.description?.trim() || null;
    }
    if (data.content !== undefined) {
      updatePayload.content = data.content?.trim() || null;
    }
    if (data.subjectId) {
      const subject = await subjectRepository.findById(data.subjectId);
      if (!subject) {
        const error = new Error(`Subject with ID "${data.subjectId}" was not found.`);
        error.statusCode = 404;
        throw error;
      }
      updatePayload.subjectId = data.subjectId;
      updatePayload.courseId = subject.courseId;
    }
    if (data.categoryId !== undefined) {
      updatePayload.categoryId = data.categoryId || null;
    }
    if (data.semester !== undefined) {
      updatePayload.semester = parseInt(data.semester, 10) || null;
    }
    if (data.academicYear !== undefined) {
      updatePayload.academicYear = data.academicYear?.trim() || null;
    }

    // Replace file if new one was uploaded
    if (data.storageKey && data.fileName) {
      // Unlink previous file if present and different
      if (note.storageKey && note.storageKey !== data.storageKey) {
        this.storage.deleteFile(note.storageKey).catch(() => {});
      }
      updatePayload.storageKey = data.storageKey;
      updatePayload.fileName = data.fileName;
      updatePayload.fileSize =
        typeof data.fileSize === 'bigint' ? data.fileSize : BigInt(data.fileSize || 0);
      updatePayload.mimeType = data.mimeType || 'application/pdf';
    }

    const updated = await this.repo.update(noteId, updatePayload);
    return sanitizeNote(updated);
  }

  /**
   * Deletes a note with ownership and state verification.
   *
   * @param {string} noteId
   * @param {string} userId
   * @param {string} userRole
   * @returns {Promise<boolean>}
   */
  async deleteNote(noteId, userId, userRole) {
    const note = await this.repo.findById(noteId);
    if (!note) {
      const error = new Error(`Note with ID "${noteId}" was not found.`);
      error.statusCode = 404;
      error.code = 'NOTE_NOT_FOUND';
      throw error;
    }

    assertNoteOwnership(note, userId, userRole);

    const isStaff = userRole === ROLES.ADMIN || userRole === ROLES.SUPER_ADMIN;

    // Invariant: Non-staff can only delete DRAFT or REJECTED notes
    if (!isStaff && !['DRAFT', 'REJECTED'].includes(note.status)) {
      const error = new Error(
        `Notes with status "${note.status}" cannot be deleted by students. Please contact support or moderation.`
      );
      error.statusCode = 403;
      error.code = 'NOTE_DELETE_LOCKED';
      throw error;
    }

    // Delete stored file if exists
    if (note.storageKey) {
      await this.storage.deleteFile(note.storageKey).catch(() => {});
    }

    await this.repo.delete(noteId);
    return true;
  }

  /**
   * Submits a DRAFT or REJECTED note for moderation review.
   *
   * @param {string} noteId
   * @param {string} userId
   * @param {string} userRole
   * @returns {Promise<any>}
   */
  async submitForReview(noteId, userId, userRole) {
    const note = await this.repo.findById(noteId);
    if (!note) {
      const error = new Error(`Note with ID "${noteId}" was not found.`);
      error.statusCode = 404;
      error.code = 'NOTE_NOT_FOUND';
      throw error;
    }

    assertNoteOwnership(note, userId, userRole);

    if (!['DRAFT', 'REJECTED'].includes(note.status)) {
      const error = new Error(
        `Note cannot be submitted for review because it is currently "${note.status}".`
      );
      error.statusCode = 400;
      error.code = 'INVALID_SUBMISSION_STATE';
      throw error;
    }

    // Validate minimum required payload before submission
    if (!note.title || (!note.content && !note.storageKey)) {
      const error = new Error(
        'Note must contain title and either written content or an attached study document to be submitted.'
      );
      error.statusCode = 400;
      error.code = 'INCOMPLETE_NOTE';
      throw error;
    }

    const updated = await this.repo.update(noteId, {
      status: 'PENDING_REVIEW',
      rejectionReason: null // clear previous feedback upon resubmission
    });

    return sanitizeNote(updated);
  }

  /**
   * Archives an approved note.
   *
   * @param {string} noteId
   * @param {string} userId
   * @param {string} userRole
   * @returns {Promise<any>}
   */
  async archiveNote(noteId, userId, userRole) {
    const note = await this.repo.findById(noteId);
    if (!note) {
      const error = new Error(`Note with ID "${noteId}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    assertNoteOwnership(note, userId, userRole);

    if (note.status !== 'APPROVED') {
      const error = new Error('Only approved published notes can be archived.');
      error.statusCode = 400;
      throw error;
    }

    const updated = await this.repo.update(noteId, {
      status: 'ARCHIVED'
    });

    return sanitizeNote(updated);
  }

  /**
   * Reviews and approves or rejects a note (moderator workflow with audit logging).
   *
   * @param {string} noteId
   * @param {'APPROVED' | 'REJECTED'} newStatus
   * @param {string} actorId
   * @param {string} [reason]
   * @returns {Promise<any>}
   */
  async reviewNoteSubmission(noteId, newStatus, actorId, reason) {
    const normalized = normalizeStatus(newStatus);
    if (!['APPROVED', 'REJECTED'].includes(normalized)) {
      const error = new Error(
        `Invalid review decision "${newStatus}". Must be "APPROVED" or "REJECTED".`
      );
      error.statusCode = 400;
      throw error;
    }

    const note = await this.repo.findById(noteId);
    if (!note) {
      const error = new Error(`Note with ID "${noteId}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    // Invariant: Note must be pending review
    if (!['PENDING', 'PENDING_REVIEW'].includes(note.status)) {
      const error = new Error(
        `Note is currently "${note.status}" and cannot be reviewed. Only pending notes can be approved or rejected.`
      );
      error.statusCode = 400;
      error.code = 'NOTE_NOT_PENDING';
      throw error;
    }

    // Author cannot review their own note
    if (note.uploadedById === actorId) {
      const error = new Error('Moderators cannot review their own submitted notes.');
      error.statusCode = 403;
      error.code = 'CANNOT_REVIEW_OWN_NOTE';
      throw error;
    }

    if (normalized === 'REJECTED' && (!reason || reason.trim().length === 0)) {
      const error = new Error(
        'A constructive rejection reason is required to help the student improve their submission.'
      );
      error.statusCode = 400;
      error.code = 'REJECTION_REASON_REQUIRED';
      throw error;
    }

    // Perform update and audit log in transaction
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.note.update({
        where: { id: noteId },
        data: {
          status: normalized,
          publishedAt: normalized === 'APPROVED' ? new Date() : note.publishedAt,
          rejectionReason: normalized === 'REJECTED' ? reason.trim() : null
        },
        include: {
          course: { select: { id: true, name: true, slug: true } },
          subject: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
          uploadedBy: {
            select: { id: true, name: true, email: true, avatarUrl: true }
          }
        }
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: normalized === 'APPROVED' ? 'NOTE_APPROVED' : 'NOTE_REJECTED',
          entityType: 'Note',
          entityId: noteId,
          metadata: {
            noteTitle: note.title,
            previousStatus: note.status,
            decision: normalized,
            reason: reason || null
          }
        }
      });

      return updated;
    });

    return sanitizeNote(result);
  }

  /**
   * Lists approved notes for the public Notes Library.
   *
   * @param {{
   *   page?: number,
   *   limit?: number,
   *   search?: string,
   *   subjectId?: string,
   *   categoryId?: string,
   *   courseId?: string,
   *   semester?: number,
   *   academicYear?: string,
   *   sortBy?: string,
   *   sortOrder?: string
   * }} query
   * Retrieves public exploration notes with search, academic filters, and deterministic sorting.
   * STRICT INVARIANT: Only status: 'APPROVED' notes are returned.
   *
   * @param {{
   *   page?: number,
   *   limit?: number,
   *   search?: string,
   *   courseId?: string,
   *   subjectId?: string,
   *   categoryId?: string,
   *   topicId?: string,
   *   semester?: number,
   *   academicYear?: string,
   *   sort?: string,
   *   sortBy?: string,
   *   order?: string
   * }} query
   * @returns {Promise<{ notes: any[], pagination: any, items: any[], meta: any }>}
   */
  async listNotes(query = {}) {
    const rawLimit = parseInt(query.limit, 10);
    const limit = Math.min(Math.max(!isNaN(rawLimit) && rawLimit > 0 ? rawLimit : 12, 1), 50);

    const rawPage = parseInt(query.page, 10);
    const page = Math.max(!isNaN(rawPage) && rawPage > 0 ? rawPage : 1, 1);
    const skip = (page - 1) * limit;

    // Strict visibility invariant: approved notes only
    const where = { status: 'APPROVED' };

    // Academic filters
    if (query.courseId && typeof query.courseId === 'string' && query.courseId.trim().length > 0) {
      where.courseId = query.courseId.trim();
    }
    if (
      query.subjectId &&
      typeof query.subjectId === 'string' &&
      query.subjectId.trim().length > 0
    ) {
      where.subjectId = query.subjectId.trim();
    }
    if (
      query.categoryId &&
      typeof query.categoryId === 'string' &&
      query.categoryId.trim().length > 0
    ) {
      where.categoryId = query.categoryId.trim();
    }
    if (query.topicId && typeof query.topicId === 'string' && query.topicId.trim().length > 0) {
      where.topicId = query.topicId.trim();
    }
    if (
      query.semester !== undefined &&
      query.semester !== null &&
      String(query.semester).trim() !== ''
    ) {
      const parsedSem = parseInt(query.semester, 10);
      if (!isNaN(parsedSem) && parsedSem >= 1 && parsedSem <= 12) {
        where.semester = parsedSem;
      }
    }
    if (
      query.academicYear &&
      typeof query.academicYear === 'string' &&
      query.academicYear.trim().length > 0
    ) {
      where.academicYear = query.academicYear.trim();
    }

    // Keyword search with length constraint (max 100 characters)
    if (query.search && typeof query.search === 'string') {
      const trimmedSearch = query.search.trim().slice(0, 100);
      if (trimmedSearch.length > 0) {
        where.OR = [
          { title: { contains: trimmedSearch } },
          { description: { contains: trimmedSearch } },
          { subject: { name: { contains: trimmedSearch } } },
          { course: { name: { contains: trimmedSearch } } }
        ];
      }
    }

    // Deterministic sorting with allowlist
    const sortKey = (query.sort || query.sortBy || 'newest').toLowerCase();
    const orderDirection = (query.order || '').toLowerCase() === 'asc' ? 'asc' : 'desc';

    let orderBy;
    switch (sortKey) {
      case 'oldest':
        orderBy = [{ publishedAt: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }];
        break;
      case 'title_asc':
      case 'titleasc':
      case 'title-a-z':
        orderBy = [{ title: 'asc' }, { id: 'asc' }];
        break;
      case 'title_desc':
      case 'titledesc':
      case 'title-z-a':
        orderBy = [{ title: 'desc' }, { id: 'desc' }];
        break;
      case 'title':
        orderBy = [{ title: orderDirection }, { id: orderDirection }];
        break;
      case 'downloads':
      case 'mostdownloaded':
        orderBy = [{ downloadCount: 'desc' }, { publishedAt: 'desc' }, { id: 'desc' }];
        break;
      case 'views':
      case 'mostviewed':
        orderBy = [{ viewCount: 'desc' }, { publishedAt: 'desc' }, { id: 'desc' }];
        break;
      case 'newest':
      default:
        orderBy = [{ publishedAt: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }];
        break;
    }

    const [items, total] = await Promise.all([
      this.repo.findMany({ skip, take: limit, where, orderBy }),
      this.repo.count(where)
    ]);

    const sanitized = items.map(sanitizeNote);
    const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);

    return {
      notes: sanitized,
      pagination: {
        page,
        limit,
        total,
        totalPages
      },
      items: sanitized,
      meta: {
        page,
        limit,
        totalItems: total,
        totalPages
      }
    };
  }

  /**
   * Retrieves academic filter taxonomies for the discovery experience.
   *
   * @returns {Promise<{
   *   courses: any[],
   *   categories: any[],
   *   subjects: any[],
   *   semesters: number[],
   *   totalApprovedNotes: number
   * }>}
   */
  async getExploreFilters() {
    const [courses, categories, subjects, totalApprovedNotes] = await Promise.all([
      courseRepository.findMany({
        take: 100,
        where: { isActive: true }
      }),
      categoryRepository.findAll({ isActive: true }),
      subjectRepository.findMany({
        take: 500,
        where: { isActive: true }
      }),
      this.repo.count({ status: 'APPROVED' })
    ]);

    // Unique active semesters from subjects
    const semesterSet = new Set(subjects.map((s) => s.semester).filter(Boolean));
    const semesters = Array.from(semesterSet).sort((a, b) => a - b);
    if (semesters.length === 0) {
      semesters.push(1, 2, 3, 4, 5, 6, 7, 8);
    }

    return {
      courses: courses.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug
      })),
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        noteCount: cat._count?.notes || 0
      })),
      subjects: subjects.map((s) => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        courseId: s.courseId,
        semester: s.semester
      })),
      semesters,
      totalApprovedNotes
    };
  }

  /**
   * Retrieves notes uploaded by the current student for the "My Notes" dashboard.
   *
   * @param {string} userId
   * @param {{
   *   page?: number,
   *   limit?: number,
   *   status?: string,
   *   search?: string
   * }} query
   * @returns {Promise<any>}
   */
  async getUserNotes(userId, query = {}) {
    const { page, limit, skip } = getPaginationParams(query);
    const where = { uploadedById: userId };

    if (query.status) {
      const normalized = normalizeStatus(query.status);
      if (VALID_NOTE_STATUSES.includes(normalized)) {
        where.status = normalized;
      }
    }

    if (query.search && query.search.trim().length > 0) {
      where.title = { contains: query.search.trim() };
    }

    const [items, total] = await Promise.all([
      this.repo.findMany({
        skip,
        take: limit,
        where,
        orderBy: { updatedAt: 'desc' }
      }),
      this.repo.count(where)
    ]);

    const sanitized = items.map(sanitizeNote);
    return buildPaginatedResponse(sanitized, total, page, limit);
  }

  /**
   * Retrieves pending notes in the moderation queue for staff.
   *
   * @param {{
   *   page?: number,
   *   limit?: number,
   *   search?: string
   * }} query
   * @returns {Promise<any>}
   */
  async getModerationQueue(query = {}) {
    const { page, limit, skip } = getPaginationParams(query);
    const where = {
      status: { in: ['PENDING', 'PENDING_REVIEW'] }
    };

    if (query.search && query.search.trim().length > 0) {
      where.title = { contains: query.search.trim() };
    }

    const [items, total] = await Promise.all([
      this.repo.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'asc' }
      }),
      this.repo.count(where)
    ]);

    const sanitized = items.map(sanitizeNote);
    return buildPaginatedResponse(sanitized, total, page, limit);
  }

  /**
   * Authorizes and returns stream for note document download.
   *
   * @param {string} noteId
   * @param {object|null} currentUser
   * @returns {Promise<{ stream: any, fileName: string, mimeType: string, size: number }>}
   */
  async getNoteFileForDownload(noteId, currentUser = null) {
    const note = await this.repo.findById(noteId);
    if (!note) {
      const error = new Error(`Note with ID "${noteId}" was not found.`);
      error.statusCode = 404;
      error.code = 'NOTE_NOT_FOUND';
      throw error;
    }

    if (!note.storageKey) {
      const error = new Error('This study note does not have an attached file.');
      error.statusCode = 404;
      error.code = 'NO_FILE_ATTACHED';
      throw error;
    }

    // Access check: only approved notes are public; non-approved require owner or staff
    if (note.status !== 'APPROVED') {
      const isOwner = currentUser && note.uploadedById === currentUser.id;
      const isStaff =
        currentUser &&
        (currentUser.role === ROLES.MODERATOR ||
          currentUser.role === ROLES.ADMIN ||
          currentUser.role === ROLES.SUPER_ADMIN);

      if (!isOwner && !isStaff) {
        const error = new Error(
          'File download is restricted while note is in draft or moderation review.'
        );
        error.statusCode = 403;
        error.code = 'DOWNLOAD_FORBIDDEN';
        throw error;
      }
    }

    // Increment download count asynchronously
    if (note.status === 'APPROVED') {
      this.repo.incrementDownloadCount(noteId).catch(() => {});
    }

    // Record user download history asynchronously if authenticated
    if (currentUser && currentUser.id) {
      this.repo.recordDownloadHistory(currentUser.id, noteId).catch(() => {});
    }

    const { stream, size } = await this.storage.getFileStream(note.storageKey);
    return {
      stream,
      fileName: note.fileName || 'study-document.pdf',
      mimeType: note.mimeType || 'application/pdf',
      size
    };
  }

  // =========================================================================
  // BOOKMARK & REVIEW METHODS
  // =========================================================================

  async bookmarkNote(userId, noteId) {
    const note = await this.repo.findById(noteId);
    if (!note) {
      const error = new Error(`Note with ID "${noteId}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    const existing = await this.repo.findBookmark(userId, noteId);
    if (existing) {
      return { bookmarked: true, message: 'Note is already bookmarked.' };
    }

    await this.repo.createBookmark(userId, noteId);
    return { bookmarked: true, message: 'Note bookmarked successfully.' };
  }

  async removeBookmark(userId, noteId) {
    try {
      await this.repo.deleteBookmark(userId, noteId);
      return { bookmarked: false, message: 'Bookmark removed.' };
    } catch {
      return { bookmarked: false, message: 'Bookmark not found.' };
    }
  }

  async reviewNote(userId, noteId, rating, comment) {
    const parsedRating = parseInt(String(rating), 10);
    if (Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      const error = new Error('Rating must be an integer between 1 and 5.');
      error.statusCode = 400;
      throw error;
    }

    const note = await this.repo.findById(noteId);
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

    return this.repo.upsertReview(userId, noteId, parsedRating, comment);
  }
}

export const noteService = new NoteService();
export default noteService;
