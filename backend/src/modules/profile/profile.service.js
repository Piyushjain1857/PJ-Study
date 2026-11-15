import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import prisma from '../../config/database.js';
import env from '../../config/env.js';
import userRepository, { USER_SAFE_SELECT } from '../users/user.repository.js';
import { validateAvatarBuffer } from './profile.upload.js';
import { getPaginationParams, buildPaginatedResponse } from '../../utils/pagination.js';

export class ProfileService {
  constructor() {
    this.avatarDir = path.resolve(env.uploadDir || './uploads', 'avatars');
    this.ensureAvatarDirectory();
  }

  ensureAvatarDirectory() {
    try {
      if (!fs.existsSync(this.avatarDir)) {
        fs.mkdirSync(this.avatarDir, { recursive: true });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to initialize avatar storage directory:', err.message);
    }
  }

  /**
   * Retrieves authenticated scholar's own complete profile and database-backed contribution statistics.
   *
   * @param {string} userId
   * @returns {Promise<any>}
   */
  async getOwnProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      const error = new Error('Profile not found.');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const stats = await this.getOwnStats(userId);
    return {
      ...user,
      stats
    };
  }

  /**
   * Updates permitted fields on the authenticated scholar's personal profile.
   *
   * @param {string} userId
   * @param {{
   *   name?: string,
   *   bio?: string | null,
   *   university?: string | null,
   *   courseId?: string | null,
   *   semester?: number | null
   * }} updateData
   * @returns {Promise<any>}
   */
  async updateOwnProfile(userId, updateData) {
    const dataToUpdate = {};

    if (updateData.name !== undefined) {
      dataToUpdate.name = updateData.name.trim();
    }

    if (updateData.bio !== undefined) {
      dataToUpdate.bio = updateData.bio ? updateData.bio.trim() : null;
    }

    if (updateData.university !== undefined) {
      dataToUpdate.university = updateData.university ? updateData.university.trim() : null;
    }

    if (updateData.universityId !== undefined) {
      if (updateData.universityId && updateData.universityId.trim()) {
        const uni = await prisma.university.findUnique({
          where: { id: updateData.universityId.trim() }
        });
        if (uni) {
          dataToUpdate.universityId = uni.id;
          if (!dataToUpdate.university) {
            dataToUpdate.university = uni.name;
          }
        }
      } else {
        dataToUpdate.universityId = null;
      }
    }

    if (updateData.courseId !== undefined) {
      if (updateData.courseId && updateData.courseId.trim()) {
        const course = await prisma.course.findUnique({
          where: { id: updateData.courseId.trim() }
        });
        if (!course) {
          const error = new Error('Selected academic degree or course was not found.');
          error.statusCode = 400;
          error.code = 'COURSE_NOT_FOUND';
          throw error;
        }
        dataToUpdate.courseId = course.id;
      } else {
        dataToUpdate.courseId = null;
      }
    }

    if (updateData.semester !== undefined) {
      if (updateData.semester === null || updateData.semester === '') {
        dataToUpdate.semester = null;
      } else {
        const sem = Number(updateData.semester);
        if (!Number.isInteger(sem) || sem < 1 || sem > 12) {
          const error = new Error('Semester must be an integer between 1 and 12.');
          error.statusCode = 400;
          error.code = 'INVALID_SEMESTER';
          throw error;
        }
        dataToUpdate.semester = sem;
      }
    }

    const updatedUser = await userRepository.update(userId, dataToUpdate);
    return updatedUser;
  }

  /**
   * Updates privacy controls for the scholar's profile.
   *
   * @param {string} userId
   * @param {{
   *   publicProfileEnabled?: boolean,
   *   showAcademicInfo?: boolean,
   *   showBio?: boolean,
   *   showContributionStats?: boolean
   * }} privacySettings
   * @returns {Promise<any>}
   */
  async updatePrivacySettings(userId, privacySettings) {
    const dataToUpdate = {};
    const booleanKeys = [
      'publicProfileEnabled',
      'showAcademicInfo',
      'showBio',
      'showContributionStats'
    ];

    for (const key of booleanKeys) {
      if (typeof privacySettings[key] === 'boolean') {
        dataToUpdate[key] = privacySettings[key];
      }
    }

    const updated = await userRepository.update(userId, dataToUpdate);
    return updated;
  }

  /**
   * Securely saves avatar image after magic-byte signature validation and removes previous image.
   *
   * @param {string} userId
   * @param {{ buffer: Buffer, originalname: string }} file
   * @returns {Promise<{ user: any, avatarUrl: string }>}
   */
  async uploadAvatar(userId, file) {
    if (!file || !file.buffer) {
      const error = new Error('No avatar image payload received.');
      error.statusCode = 400;
      error.code = 'FILE_EMPTY';
      throw error;
    }

    // Inspect real magic bytes
    const signature = validateAvatarBuffer(file.buffer);
    if (!signature.valid) {
      const error = new Error(
        'Uploaded file is corrupted or not a valid image. Supported: JPEG, PNG, WebP.'
      );
      error.statusCode = 400;
      error.code = 'INVALID_IMAGE_SIGNATURE';
      throw error;
    }

    this.ensureAvatarDirectory();

    // Generate safe storage filename
    const randomHash = crypto.randomBytes(16).toString('hex');
    const filename = `avatar-${userId}-${Date.now()}-${randomHash}${signature.ext}`;
    const destinationPath = path.join(this.avatarDir, filename);

    await fs.promises.writeFile(destinationPath, file.buffer);

    // Delete prior local avatar if present
    const existing = await userRepository.findById(userId);
    if (existing?.avatarUrl && existing.avatarUrl.startsWith('/api/v1/profile/avatar/')) {
      const oldFilename = existing.avatarUrl.replace('/api/v1/profile/avatar/', '');
      this.safeDeleteAvatarFile(oldFilename);
    }

    const avatarUrl = `/api/v1/profile/avatar/${filename}`;
    const updatedUser = await userRepository.update(userId, { avatarUrl });

    return {
      user: updatedUser,
      avatarUrl
    };
  }

  /**
   * Removes custom profile avatar and reverts user avatar to null (initials fallback).
   *
   * @param {string} userId
   * @returns {Promise<any>}
   */
  async removeAvatar(userId) {
    const existing = await userRepository.findById(userId);
    if (!existing) {
      const error = new Error('User not found.');
      error.statusCode = 404;
      throw error;
    }

    if (existing.avatarUrl && existing.avatarUrl.startsWith('/api/v1/profile/avatar/')) {
      const oldFilename = existing.avatarUrl.replace('/api/v1/profile/avatar/', '');
      this.safeDeleteAvatarFile(oldFilename);
    }

    const updatedUser = await userRepository.update(userId, { avatarUrl: null });
    return updatedUser;
  }

  /**
   * Deletes an avatar file safely, ignoring errors if file doesn't exist.
   *
   * @param {string} filename
   */
  async safeDeleteAvatarFile(filename) {
    try {
      const safeName = path.basename(filename);
      const fullPath = path.join(this.avatarDir, safeName);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } catch {
      // Ignore background cleanup failures
    }
  }

  /**
   * Retrieves readable file stream for serving avatars with strict path traversal prevention.
   *
   * @param {string} filename
   * @returns {Promise<{ stream: fs.ReadStream, mimeType: string, size: number }>}
   */
  async getAvatarStream(filename) {
    if (!filename || typeof filename !== 'string') {
      const error = new Error('Invalid avatar file identifier.');
      error.statusCode = 400;
      throw error;
    }

    const safeBaseName = path.basename(filename);
    const resolvedPath = path.join(this.avatarDir, safeBaseName);

    if (!resolvedPath.startsWith(this.avatarDir) || safeBaseName !== filename) {
      const error = new Error('Path traversal detected.');
      error.statusCode = 403;
      error.code = 'INVALID_STORAGE_PATH';
      throw error;
    }

    try {
      const stat = await fs.promises.stat(resolvedPath);
      const ext = path.extname(safeBaseName).toLowerCase();
      let mimeType = 'image/jpeg';
      if (ext === '.png') mimeType = 'image/png';
      if (ext === '.webp') mimeType = 'image/webp';

      const stream = fs.createReadStream(resolvedPath);
      return { stream, mimeType, size: stat.size };
    } catch {
      const error = new Error('Requested avatar image was not found.');
      error.statusCode = 404;
      error.code = 'AVATAR_NOT_FOUND';
      throw error;
    }
  }

  /**
   * Computes genuine database-calculated statistics for a scholar's contributions.
   *
   * @param {string} userId
   * @returns {Promise<{
   *   totalUploads: number,
   *   approvedNotes: number,
   *   pendingNotes: number,
   *   rejectedNotes: number,
   *   totalDownloads: number,
   *   totalViews: number,
   *   averageRating: number,
   *   totalReviews: number
   * }>}
   */
  async getOwnStats(userId) {
    const [totalUploads, publishedNotes, unpublishedNotes, pendingNotes, rejectedNotes, notesAgg, reviewsAgg] =
      await Promise.all([
        prisma.note.count({ where: { uploadedById: userId } }),
        prisma.note.count({ where: { uploadedById: userId, status: { in: ['PUBLISHED', 'APPROVED'] } } }),
        prisma.note.count({
          where: {
            uploadedById: userId,
            status: { in: ['UNPUBLISHED', 'DRAFT', 'PENDING', 'PENDING_REVIEW', 'REJECTED', 'ARCHIVED'] }
          }
        }),
        prisma.note.count({
          where: {
            uploadedById: userId,
            status: { in: ['PENDING', 'PENDING_REVIEW'] }
          }
        }),
        prisma.note.count({
          where: {
            uploadedById: userId,
            status: 'REJECTED'
          }
        }),
        prisma.note.aggregate({
          where: { uploadedById: userId },
          _sum: { downloadCount: true, viewCount: true }
        }),
        prisma.review.aggregate({
          where: {
            note: { uploadedById: userId, status: { in: ['PUBLISHED', 'APPROVED'] } },
            status: 'VISIBLE'
          },
          _avg: { rating: true },
          _count: { id: true }
        })
      ]);

    return {
      totalUploads,
      publishedNotes,
      unpublishedNotes,
      approvedNotes: publishedNotes,
      pendingNotes,
      rejectedNotes,
      totalDownloads: notesAgg._sum.downloadCount || 0,
      totalViews: notesAgg._sum.viewCount || 0,
      averageRating: reviewsAgg._avg.rating ? Number(reviewsAgg._avg.rating.toFixed(1)) : 0,
      totalReviews: reviewsAgg._count.id || 0
    };
  }

  /**
   * Retrieves paginated notes uploaded by the current scholar with status filters and search.
   *
   * @param {string} userId
   * @param {{
   *   page?: string | number,
   *   limit?: string | number,
   *   status?: string,
   *   search?: string,
   *   sort?: string
   * }} query
   * @returns {Promise<any>}
   */
  async getOwnUploads(userId, query = {}) {
    const pagination = getPaginationParams(query);
    const where = { uploadedById: userId };

    if (query.status && query.status !== 'ALL') {
      const upper = String(query.status).toUpperCase();
      if (upper === 'PUBLISHED') {
        where.status = { in: ['PUBLISHED', 'APPROVED'] };
      } else if (upper === 'UNPUBLISHED') {
        where.status = { in: ['UNPUBLISHED', 'DRAFT', 'PENDING', 'PENDING_REVIEW', 'REJECTED', 'ARCHIVED'] };
      } else if (query.status === 'PENDING') {
        where.status = { in: ['PENDING', 'PENDING_REVIEW'] };
      } else {
        where.status = query.status;
      }
    }

    if (query.search && query.search.trim()) {
      const term = query.search.trim();
      where.OR = [{ title: { contains: term } }, { description: { contains: term } }];
    }

    let orderBy = { createdAt: 'desc' };
    if (query.sort === 'oldest') orderBy = { createdAt: 'asc' };
    if (query.sort === 'downloads') orderBy = { downloadCount: 'desc' };
    if (query.sort === 'views') orderBy = { viewCount: 'desc' };
    if (query.sort === 'title') orderBy = { title: 'asc' };

    const [items, totalItems] = await Promise.all([
      prisma.note.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy,
        include: {
          course: { select: { id: true, name: true, slug: true } },
          subject: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
          _count: {
            select: {
              bookmarks: true,
              reviews: true
            }
          }
        }
      }),
      prisma.note.count({ where })
    ]);

    // Format notes with rating and metrics
    const formattedItems = await Promise.all(
      items.map(async (note) => {
        const ratingAgg = await prisma.review.aggregate({
          where: { noteId: note.id, status: 'VISIBLE' },
          _avg: { rating: true }
        });

        return {
          id: note.id,
          title: note.title,
          slug: note.slug,
          description: note.description,
          fileName: note.fileName,
          fileSize: note.fileSize.toString(),
          mimeType: note.mimeType,
          pageCount: note.pageCount,
          semester: note.semester,
          academicYear: note.academicYear,
          status: note.status,
          rejectionReason: note.rejectionReason,
          downloadCount: note.downloadCount,
          viewCount: note.viewCount,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          publishedAt: note.publishedAt,
          course: note.course,
          subject: note.subject,
          category: note.category,
          bookmarkCount: note._count?.bookmarks || 0,
          reviewCount: note._count?.reviews || 0,
          averageRating: ratingAgg._avg.rating ? Number(ratingAgg._avg.rating.toFixed(1)) : 0
        };
      })
    );

    return buildPaginatedResponse(formattedItems, totalItems, pagination);
  }

  /**
   * Retrieves public contributor profile, strictly respecting privacy preferences.
   *
   * @param {string} contributorId
   * @returns {Promise<any>}
   */
  async getPublicContributorProfile(contributorId) {
    const user = await prisma.user.findUnique({
      where: { id: contributorId },
      select: USER_SAFE_SELECT
    });

    if (!user || !user.isActive) {
      const error = new Error('Contributor profile not found or inactive.');
      error.statusCode = 404;
      error.code = 'CONTRIBUTOR_NOT_FOUND';
      throw error;
    }

    // If contributor opted out of public profile
    if (!user.publicProfileEnabled) {
      return {
        id: user.id,
        name: user.name,
        avatarUrl: user.avatarUrl,
        isPrivate: true,
        message: 'This contributor has configured their academic profile as private.'
      };
    }

    // Public statistics for published contributions only
    const [approvedNotesCount, notesAgg, reviewsAgg] = await Promise.all([
      prisma.note.count({
        where: { uploadedById: contributorId, status: { in: ['PUBLISHED', 'APPROVED'] } }
      }),
      prisma.note.aggregate({
        where: { uploadedById: contributorId, status: { in: ['PUBLISHED', 'APPROVED'] } },
        _sum: { downloadCount: true, viewCount: true }
      }),
      prisma.review.aggregate({
        where: {
          note: { uploadedById: contributorId, status: { in: ['PUBLISHED', 'APPROVED'] } },
          status: 'VISIBLE'
        },
        _avg: { rating: true },
        _count: { id: true }
      })
    ]);

    const publicStats = {
      totalApprovedNotes: approvedNotesCount,
      totalDownloads: notesAgg._sum.downloadCount || 0,
      totalViews: notesAgg._sum.viewCount || 0,
      averageRating: reviewsAgg._avg.rating ? Number(reviewsAgg._avg.rating.toFixed(1)) : 0,
      totalReviews: reviewsAgg._count.id || 0
    };

    return {
      id: user.id,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      isPrivate: false,
      bio: user.showBio ? user.bio : null,
      academicInfo: user.showAcademicInfo
        ? {
            university: user.university,
            course: user.course,
            semester: user.semester
          }
        : null,
      stats: user.showContributionStats ? publicStats : null
    };
  }

  /**
   * Retrieves approved public notes for a public contributor.
   *
   * @param {string} contributorId
   * @param {{ page?: string | number, limit?: string | number, sort?: string }} query
   * @returns {Promise<any>}
   */
  async getPublicContributorNotes(contributorId, query = {}) {
    const user = await prisma.user.findUnique({
      where: { id: contributorId },
      select: { id: true, isActive: true, publicProfileEnabled: true }
    });

    if (!user || !user.isActive) {
      const error = new Error('Contributor profile not found.');
      error.statusCode = 404;
      error.code = 'CONTRIBUTOR_NOT_FOUND';
      throw error;
    }

    if (!user.publicProfileEnabled) {
      const error = new Error('This contributor profile is private.');
      error.statusCode = 403;
      error.code = 'PROFILE_IS_PRIVATE';
      throw error;
    }

    const pagination = getPaginationParams(query);
    const where = {
      uploadedById: contributorId,
      status: { in: ['PUBLISHED', 'APPROVED'] }
    };

    let orderBy = { createdAt: 'desc' };
    if (query.sort === 'oldest') orderBy = { createdAt: 'asc' };
    if (query.sort === 'downloads') orderBy = { downloadCount: 'desc' };
    if (query.sort === 'views') orderBy = { viewCount: 'desc' };
    if (query.sort === 'title') orderBy = { title: 'asc' };

    const [notes, totalItems] = await Promise.all([
      prisma.note.findMany({
        where,
        skip: pagination.skip,
        take: pagination.take,
        orderBy,
        include: {
          course: { select: { id: true, name: true, slug: true } },
          subject: { select: { id: true, name: true, slug: true } },
          category: { select: { id: true, name: true, slug: true } },
          _count: {
            select: {
              bookmarks: true,
              reviews: true
            }
          }
        }
      }),
      prisma.note.count({ where })
    ]);

    const formattedNotes = await Promise.all(
      notes.map(async (note) => {
        const ratingAgg = await prisma.review.aggregate({
          where: { noteId: note.id, status: 'VISIBLE' },
          _avg: { rating: true }
        });

        return {
          id: note.id,
          title: note.title,
          slug: note.slug,
          description: note.description,
          fileName: note.fileName,
          fileSize: note.fileSize.toString(),
          mimeType: note.mimeType,
          pageCount: note.pageCount,
          semester: note.semester,
          academicYear: note.academicYear,
          status: note.status,
          downloadCount: note.downloadCount,
          viewCount: note.viewCount,
          createdAt: note.createdAt,
          publishedAt: note.publishedAt,
          course: note.course,
          subject: note.subject,
          category: note.category,
          bookmarkCount: note._count?.bookmarks || 0,
          reviewCount: note._count?.reviews || 0,
          averageRating: ratingAgg._avg.rating ? Number(ratingAgg._avg.rating.toFixed(1)) : 0
        };
      })
    );

    return buildPaginatedResponse(formattedNotes, totalItems, pagination);
  }

  /**
   * Exposes active academic metadata (courses with subjects and available semesters) for profile selection.
   *
   * @returns {Promise<any>}
   */
  async getAcademicOptions() {
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      include: {
        subjects: {
          where: { isActive: true },
          select: { id: true, name: true, semester: true }
        }
      }
    });

    const preferredOrder = ['B.Tech', 'BCA', 'B.Sc.', 'MCA', 'M.Tech'];

    // Prioritize and filter to the canonical degree programs requested
    const canonicalCourses = courses.filter((c) =>
      preferredOrder.some((p) => p.toLowerCase() === c.name.toLowerCase().trim())
    );

    // Fall back to all active courses if in test isolation where canonical ones aren't present
    const activeCourses = canonicalCourses.length > 0 ? canonicalCourses : courses;

    activeCourses.sort((a, b) => {
      const idxA = preferredOrder.findIndex((p) => p.toLowerCase() === a.name.toLowerCase().trim());
      const idxB = preferredOrder.findIndex((p) => p.toLowerCase() === b.name.toLowerCase().trim());
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });

    return activeCourses.map((course) => {
      const count = course.semestersCount || 8;
      const semesters = Array.from({ length: count }, (_, i) => i + 1);
      return {
        id: course.id,
        name: course.name,
        slug: course.slug,
        code: course.code,
        degreeLevel: course.degreeLevel,
        universityId: course.universityId,
        description: course.description,
        semesters
      };
    });
  }
}

export const profileService = new ProfileService();
export default profileService;
