import crypto from 'crypto';
import prisma from '../../config/database.js';
import noteRepository, { NoteRepository } from './note.repository.js';
import userRepository from '../users/user.repository.js';
import courseRepository from '../courses/course.repository.js';
import subjectRepository from '../subjects/subject.repository.js';
import topicRepository from '../topics/topic.repository.js';
import categoryRepository from '../categories/category.repository.js';
import storageService from '../../services/storage/storage.service.js';
import notificationService from '../notifications/notification.service.js';
import { slugify } from '../courses/course.service.js';
import { getPaginationParams, buildPaginatedResponse } from '../../utils/pagination.js';
import { assertNoteOwnership } from '../../auth/ownership.js';
import { ROLES } from '../../auth/rolePermissions.js';

export const PUBLISHED_STATUSES = ['PUBLISHED', 'APPROVED'];
export const UNPUBLISHED_STATUSES = [
  'UNPUBLISHED',
  'DRAFT',
  'PENDING',
  'PENDING_REVIEW',
  'REJECTED',
  'ARCHIVED'
];

export const VALID_NOTE_STATUSES = [
  'PUBLISHED',
  'UNPUBLISHED',
  'DRAFT',
  'PENDING',
  'PENDING_REVIEW',
  'APPROVED',
  'REJECTED',
  'ARCHIVED'
];

/**
 * In-memory debounce cache to prevent duplicate view increments from
 * rapid duplicate requests, double-clicks, or React development double-mounts.
 */
const recentViewsCache = new Map();
const VIEW_DEBOUNCE_MS = 2500;

/**
 * Normalizes input status strings so 'PENDING' and 'PENDING_REVIEW' are handled interchangeably.
 *
 * @param {string} status
 * @returns {string}
 */
export function normalizeStatus(status) {
  if (!status) return 'PUBLISHED';
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
   * @param {string|null} [clientIp=null]
   * @returns {Promise<any>}
   */
  async getNoteById(id, currentUser = null, trackView = false, clientIp = null) {
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

    // Security check: Unpublished notes are accessible ONLY to the author or staff
    const isPubliclyVisible = PUBLISHED_STATUSES.includes(note.status);
    if (!isPubliclyVisible) {
      const isOwner = currentUser && note.uploadedById === currentUser.id;
      const isStaff =
        currentUser &&
        (currentUser.role === ROLES.MODERATOR ||
          currentUser.role === ROLES.ADMIN ||
          currentUser.role === ROLES.SUPER_ADMIN);

      if (!isOwner && !isStaff) {
        const error = new Error(
          'This study note manuscript is unpublished and not accessible.'
        );
        error.statusCode = 403;
        error.code = 'NOTE_ACCESS_FORBIDDEN';
        throw error;
      }
    }

    let hasIncremented = false;
    if (trackView && isPubliclyVisible) {
      const cacheKey = currentUser?.id
        ? `user:${currentUser.id}:${id}`
        : `ip:${clientIp || 'unknown'}:${id}`;
      const now = Date.now();
      const lastViewTime = recentViewsCache.get(cacheKey);

      if (!lastViewTime || now - lastViewTime > VIEW_DEBOUNCE_MS) {
        recentViewsCache.set(cacheKey, now);
        hasIncremented = true;

        if (recentViewsCache.size > 2000) {
          const threshold = now - 10000;
          for (const [k, v] of recentViewsCache.entries()) {
            if (v < threshold) recentViewsCache.delete(k);
          }
        }

        this.repo.incrementViewCount(id).catch((err) => {
          // eslint-disable-next-line no-console
          console.error('Failed to increment note view count:', err.message);
        });

        if (currentUser && currentUser.id) {
          this.repo.recordViewHistory(currentUser.id, id).catch(() => {});
        }
      }
    }

    const ratingInfo = await this.repo.getAverageRating(id);
    return sanitizeNote({
      ...note,
      viewCount: hasIncremented ? note.viewCount + 1 : note.viewCount,
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
      universityId,
      schoolId,
      categoryId,
      semester: explicitSemester,
      academicYear,
      topicId,
      uploadedById,
      status: requestedStatus = 'PUBLISHED',
      fileName,
      storageKey,
      fileSize,
      mimeType
    } = input;

    // 0. Scholar / Student upload restriction invariant
    if (uploadedById) {
      const uploader = await prisma.user.findUnique({
        where: { id: uploadedById },
        select: { role: true }
      });
      if (uploader && uploader.role === ROLES.STUDENT) {
        const error = new Error('Scholars / Students are not authorized to upload notes.');
        error.statusCode = 403;
        error.code = 'UPLOAD_FORBIDDEN';
        throw error;
      }
    }

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

    // 3. Direct publishing workflow: authorized Admin & Super Admin uploads publish immediately
    let targetStatus = 'PUBLISHED';
    if (requestedStatus) {
      const norm = normalizeStatus(requestedStatus);
      if (norm === 'DRAFT') {
        targetStatus = 'DRAFT';
      } else if (norm === 'UNPUBLISHED') {
        targetStatus = 'UNPUBLISHED';
      }
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

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      const error = new Error(`Course with ID "${courseId}" was not found.`);
      error.statusCode = 404;
      throw error;
    }
    if (!course.isActive) {
      const error = new Error(`Selected academic course "${course.name}" is currently inactive.`);
      error.statusCode = 400;
      throw error;
    }
    if (!subject.isActive) {
      const error = new Error(`Selected subject "${subject.name}" is currently inactive.`);
      error.statusCode = 400;
      throw error;
    }

    // Dynamic semester hierarchy validation
    const semester = Number(explicitSemester || subject.semester || 1);
    if (course.semestersCount && semester > course.semestersCount) {
      const error = new Error(
        `Semester ${semester} exceeds valid course duration (${course.semestersCount} semesters) for ${course.name}.`
      );
      error.statusCode = 400;
      throw error;
    }

    // Validate university if provided
    const finalUniversityId = universityId || course.universityId || null;
    if (universityId) {
      const uni = await prisma.university.findUnique({ where: { id: universityId } });
      if (!uni || !uni.isActive) {
        const error = new Error('Selected university is invalid or inactive.');
        error.statusCode = 400;
        throw error;
      }
    }

    // Validate school if provided
    const finalSchoolId = schoolId || course.schoolId || null;
    if (schoolId) {
      const sch = await prisma.school.findUnique({ where: { id: schoolId } });
      if (!sch || !sch.isActive) {
        const error = new Error('Selected school is invalid or inactive.');
        error.statusCode = 400;
        throw error;
      }
    }

    // Verify category if provided
    if (categoryId) {
      const category = await categoryRepository.findById(categoryId);
      if (!category) {
        const error = new Error(`Category with ID "${categoryId}" was not found.`);
        error.statusCode = 404;
        throw error;
      }
      if (!category.isActive) {
        const error = new Error(`Selected category "${category.name}" is currently inactive.`);
        error.statusCode = 400;
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

    const note = await this.repo.create({
      title: title.trim(),
      slug,
      description: description?.trim() || null,
      content: content?.trim() || null,
      fileName: fileName?.trim() || null,
      storageKey: storageKey?.trim() || null,
      fileSize: size,
      mimeType: mimeType?.trim() || (hasFile ? 'application/pdf' : null),
      universityId: finalUniversityId,
      schoolId: finalSchoolId,
      courseId,
      subjectId,
      categoryId: categoryId || null,
      topicId: topicId || null,
      semester,
      academicYear: academicYear?.trim() || null,
      uploadedById,
      status: targetStatus,
      publishedAt: targetStatus === 'PUBLISHED' ? new Date() : null
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

    // Invariant: Scholars/Students cannot modify notes
    if (userRole === ROLES.STUDENT) {
      const error = new Error('Scholars / Students are not authorized to edit or update notes.');
      error.statusCode = 403;
      error.code = 'UPDATE_FORBIDDEN';
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

    if (!PUBLISHED_STATUSES.includes(note.status)) {
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
   * Publishes a note directly, making it available to Scholars.
   *
   * @param {string} noteId
   * @param {string} actorId
   * @returns {Promise<any>}
   */
  async publishNote(noteId, actorId) {
    const note = await this.repo.findById(noteId);
    if (!note) {
      const error = new Error(`Note with ID "${noteId}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.note.update({
      where: { id: noteId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        rejectionReason: null
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

    await prisma.auditLog.create({
      data: {
        actorId,
        action: 'NOTE_PUBLISHED',
        entityType: 'Note',
        entityId: noteId,
        metadata: {
          noteTitle: note.title,
          previousStatus: note.status,
          newStatus: 'PUBLISHED'
        }
      }
    });

    return sanitizeNote(updated);
  }

  /**
   * Unpublishes a note, removing it from Scholar discovery and downloads.
   *
   * @param {string} noteId
   * @param {string} actorId
   * @returns {Promise<any>}
   */
  async unpublishNote(noteId, actorId) {
    const note = await this.repo.findById(noteId);
    if (!note) {
      const error = new Error(`Note with ID "${noteId}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.note.update({
      where: { id: noteId },
      data: {
        status: 'UNPUBLISHED'
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

    await prisma.auditLog.create({
      data: {
        actorId,
        action: 'NOTE_UNPUBLISHED',
        entityType: 'Note',
        entityId: noteId,
        metadata: {
          noteTitle: note.title,
          previousStatus: note.status,
          newStatus: 'UNPUBLISHED'
        }
      }
    });

    return sanitizeNote(updated);
  }

  /**
   * Reviews and approves or rejects a note (legacy compatibility).
   *
   * @param {string} noteId
   * @param {'APPROVED' | 'REJECTED' | 'PUBLISHED' | 'UNPUBLISHED'} newStatus
   * @param {string} actorId
   * @param {string} [reason]
   * @returns {Promise<any>}
   */
  async reviewNoteSubmission(noteId, newStatus, actorId, reason) {
    const normalized = normalizeStatus(newStatus);
    if (['APPROVED', 'PUBLISH', 'PUBLISHED'].includes(normalized)) {
      return this.publishNote(noteId, actorId);
    }

    const note = await this.repo.findById(noteId);
    if (!note) {
      const error = new Error(`Note with ID "${noteId}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    const updated = await prisma.note.update({
      where: { id: noteId },
      data: {
        status: normalized === 'REJECTED' ? 'REJECTED' : 'UNPUBLISHED',
        rejectionReason: reason ? reason.trim() : null
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

    await prisma.auditLog.create({
      data: {
        actorId,
        action: 'NOTE_UNPUBLISHED',
        entityType: 'Note',
        entityId: noteId,
        metadata: {
          noteTitle: note.title,
          previousStatus: note.status,
          newStatus: normalized === 'REJECTED' ? 'REJECTED' : 'UNPUBLISHED',
          reason: reason || null
        }
      }
    });

    return sanitizeNote(updated);
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

    // Strict visibility invariant: published notes only
    const where = { status: { in: PUBLISHED_STATUSES } };

    // Academic filters
    if (
      query.universityId &&
      typeof query.universityId === 'string' &&
      query.universityId.trim().length > 0
    ) {
      where.universityId = query.universityId.trim();
    }
    if (query.schoolId && typeof query.schoolId === 'string' && query.schoolId.trim().length > 0) {
      where.schoolId = query.schoolId.trim();
    }
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
    const [universities, courses, categories, subjects, totalApprovedNotes] = await Promise.all([
      prisma.university.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, shortName: true }
      }),
      courseRepository.findMany({
        take: 100,
        where: { isActive: true }
      }),
      categoryRepository.findAll({ isActive: true }),
      subjectRepository.findMany({
        take: 500,
        where: { isActive: true }
      }),
      this.repo.count({ status: { in: PUBLISHED_STATUSES } })
    ]);

    // Unique active semesters from subjects
    const semesterSet = new Set(subjects.map((s) => s.semester).filter(Boolean));
    const semesters = Array.from(semesterSet).sort((a, b) => a - b);
    if (semesters.length === 0) {
      semesters.push(1, 2, 3, 4, 5, 6, 7, 8);
    }

    const preferredOrder = ['B.Tech', 'BCA', 'B.Sc.', 'MCA', 'M.Tech'];
    const sortedCourses = [...courses].sort((a, b) => {
      const idxA = preferredOrder.findIndex((p) => p.toLowerCase() === a.name.toLowerCase().trim());
      const idxB = preferredOrder.findIndex((p) => p.toLowerCase() === b.name.toLowerCase().trim());
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    return {
      universities,
      courses: sortedCourses.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        code: c.code,
        degreeLevel: c.degreeLevel,
        semestersCount: c.semestersCount || 8,
        universityId: c.universityId
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
        code: s.code,
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
      const upper = String(query.status).toUpperCase();
      if (upper === 'PUBLISHED' || upper === 'APPROVED') {
        where.status = { in: PUBLISHED_STATUSES };
      } else if (upper === 'UNPUBLISHED') {
        where.status = { in: UNPUBLISHED_STATUSES };
      } else {
        const normalized = normalizeStatus(query.status);
        if (VALID_NOTE_STATUSES.includes(normalized)) {
          where.status = normalized;
        }
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

    // Access check: only published notes are public; unpublished require owner or staff
    if (!PUBLISHED_STATUSES.includes(note.status)) {
      const isOwner = currentUser && note.uploadedById === currentUser.id;
      const isStaff =
        currentUser &&
        (currentUser.role === ROLES.MODERATOR ||
          currentUser.role === ROLES.ADMIN ||
          currentUser.role === ROLES.SUPER_ADMIN);

      if (!isOwner && !isStaff) {
        const error = new Error(
          'File download is restricted for unpublished study notes.'
        );
        error.statusCode = 403;
        error.code = 'DOWNLOAD_FORBIDDEN';
        throw error;
      }
    }

    if (!note.storageKey) {
      const error = new Error('This study note does not have an attached file.');
      error.statusCode = 404;
      error.code = 'NO_FILE_ATTACHED';
      throw error;
    }

    // Increment download count
    if (PUBLISHED_STATUSES.includes(note.status)) {
      await this.repo.incrementDownloadCount(noteId).catch(() => {});
    }

    // Record user download history if authenticated
    if (currentUser && currentUser.id) {
      await this.repo.recordDownloadHistory(currentUser.id, noteId).catch(() => {});
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

  async getBookmarkedNotes(userId, query = {}) {
    const { page, limit, skip } = getPaginationParams(query);
    const search = query.search || '';

    const [bookmarks, total] = await Promise.all([
      this.repo.findBookmarksByUser(userId, { skip, take: limit, search }),
      this.repo.countBookmarksByUser(userId, { search })
    ]);

    const items = (bookmarks || []).map((b) => ({
      ...sanitizeNote(b.note),
      bookmarkId: b.id,
      bookmarkedAt: b.createdAt
    }));

    return buildPaginatedResponse(items, total, page, limit);
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
