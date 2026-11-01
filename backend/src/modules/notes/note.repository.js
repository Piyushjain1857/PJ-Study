import prisma from '../../config/database.js';

/**
 * Standard note selection with academic metadata and author info.
 */
export const NOTE_DETAIL_INCLUDE = {
  course: { select: { id: true, name: true, slug: true } },
  subject: { select: { id: true, name: true, slug: true, semester: true } },
  topic: { select: { id: true, name: true, slug: true } },
  uploadedBy: { select: { id: true, name: true, avatarUrl: true, role: true } },
  _count: {
    select: { bookmarks: true, reviews: true }
  }
};

/**
 * Repository handling database operations for Note, Bookmark, and Review entities.
 */
export class NoteRepository {
  /**
   * Finds a note by ID.
   *
   * @param {string} id
   * @returns {Promise<any>}
   */
  async findById(id) {
    return prisma.note.findUnique({
      where: { id },
      include: NOTE_DETAIL_INCLUDE
    });
  }

  /**
   * Creates a new Note record.
   *
   * @param {object} data
   * @returns {Promise<any>}
   */
  async create(data) {
    return prisma.note.create({
      data,
      include: NOTE_DETAIL_INCLUDE
    });
  }

  /**
   * Updates an existing note.
   *
   * @param {string} id
   * @param {object} data
   * @returns {Promise<any>}
   */
  async update(id, data) {
    return prisma.note.update({
      where: { id },
      data,
      include: NOTE_DETAIL_INCLUDE
    });
  }

  /**
   * Retrieves a paginated list of notes.
   *
   * @param {{ skip?: number, take?: number, where?: object, orderBy?: object }} options
   * @returns {Promise<any[]>}
   */
  async findMany({ skip = 0, take = 10, where = {}, orderBy = { createdAt: 'desc' } } = {}) {
    return prisma.note.findMany({
      where,
      skip,
      take,
      orderBy,
      include: NOTE_DETAIL_INCLUDE
    });
  }

  /**
   * Counts notes matching conditions.
   *
   * @param {object} [where={}]
   * @returns {Promise<number>}
   */
  async count(where = {}) {
    return prisma.note.count({ where });
  }

  /**
   * Atomically increments the view count of a note.
   *
   * @param {string} id
   * @returns {Promise<any>}
   */
  async incrementViewCount(id) {
    return prisma.note.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });
  }

  /**
   * Atomically increments the download count of a note.
   *
   * @param {string} id
   * @returns {Promise<any>}
   */
  async incrementDownloadCount(id) {
    return prisma.note.update({
      where: { id },
      data: { downloadCount: { increment: 1 } }
    });
  }

  // =========================================================================
  // BOOKMARK OPERATIONS
  // =========================================================================

  async findBookmark(userId, noteId) {
    return prisma.bookmark.findUnique({
      where: {
        user_note_bookmark_unique: { userId, noteId }
      }
    });
  }

  async createBookmark(userId, noteId) {
    return prisma.bookmark.create({
      data: { userId, noteId }
    });
  }

  async deleteBookmark(userId, noteId) {
    return prisma.bookmark.delete({
      where: {
        user_note_bookmark_unique: { userId, noteId }
      }
    });
  }

  // =========================================================================
  // REVIEW OPERATIONS
  // =========================================================================

  async findReview(userId, noteId) {
    return prisma.review.findUnique({
      where: {
        user_note_review_unique: { userId, noteId }
      }
    });
  }

  async upsertReview(userId, noteId, rating, comment) {
    return prisma.review.upsert({
      where: {
        user_note_review_unique: { userId, noteId }
      },
      create: {
        userId,
        noteId,
        rating,
        comment: comment?.trim() || null
      },
      update: {
        rating,
        comment: comment?.trim() || null
      }
    });
  }

  async getAverageRating(noteId) {
    const aggregations = await prisma.review.aggregate({
      where: { noteId },
      _avg: { rating: true },
      _count: { rating: true }
    });

    return {
      averageRating: aggregations._avg.rating || 0,
      totalReviews: aggregations._count.rating || 0
    };
  }
}

export const noteRepository = new NoteRepository();
export default noteRepository;
