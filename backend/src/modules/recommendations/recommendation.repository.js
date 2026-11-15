import prisma from '../../config/database.js';

function sanitizeNote(note) {
  if (!note) return null;
  return {
    ...note,
    fileSize: typeof note.fileSize === 'bigint' ? note.fileSize.toString() : note.fileSize
  };
}

export class RecommendationRepository {
  /**
   * Builds the student's historical academic interaction signals.
   *
   * @param {string} userId
   * @returns {Promise<{
   *   primarySubjectId: string | null,
   *   primaryCourseId: string | null,
   *   primarySemester: number | null,
   *   bookmarkedSubjectIds: Set<string>,
   *   collectionSubjectIds: Set<string>,
   *   downloadedSubjectIds: Set<string>,
   *   allSubjectIds: Set<string>,
   *   courseIds: Set<string>,
   *   semesterIds: Set<number>,
   *   excludedNoteIds: Set<string>,
   *   hasSignals: boolean
   * }>}
   */
  async getUserPersonalizationContext(userId) {
    const [bookmarks, collectionItems, downloads, uploads] = await Promise.all([
      prisma.bookmark.findMany({
        where: { userId },
        include: {
          note: {
            select: { id: true, subjectId: true, courseId: true, semester: true }
          }
        }
      }),
      prisma.studyCollectionItem.findMany({
        where: { collection: { userId } },
        include: {
          note: {
            select: { id: true, subjectId: true, courseId: true, semester: true }
          }
        }
      }),
      prisma.downloadHistory.findMany({
        where: { userId },
        include: {
          note: {
            select: { id: true, subjectId: true, courseId: true, semester: true }
          }
        }
      }),
      prisma.note.findMany({
        where: { uploadedById: userId },
        select: { id: true, subjectId: true, courseId: true, semester: true }
      })
    ]);

    const bookmarkedSubjectIds = new Set();
    const collectionSubjectIds = new Set();
    const downloadedSubjectIds = new Set();
    const allSubjectIds = new Set();
    const courseIds = new Set();
    const semesterIds = new Set();
    const excludedNoteIds = new Set();

    const subjectCounts = {};
    const courseCounts = {};
    const semesterCounts = {};

    // Process bookmarks
    for (const b of bookmarks) {
      if (!b.note) continue;
      excludedNoteIds.add(b.note.id);
      if (b.note.subjectId) {
        bookmarkedSubjectIds.add(b.note.subjectId);
        allSubjectIds.add(b.note.subjectId);
        subjectCounts[b.note.subjectId] = (subjectCounts[b.note.subjectId] || 0) + 3;
      }
      if (b.note.courseId) {
        courseIds.add(b.note.courseId);
        courseCounts[b.note.courseId] = (courseCounts[b.note.courseId] || 0) + 3;
      }
      if (b.note.semester) {
        semesterIds.add(b.note.semester);
        semesterCounts[b.note.semester] = (semesterCounts[b.note.semester] || 0) + 3;
      }
    }

    // Process collections
    for (const item of collectionItems) {
      if (!item.note) continue;
      if (item.note.subjectId) {
        collectionSubjectIds.add(item.note.subjectId);
        allSubjectIds.add(item.note.subjectId);
        subjectCounts[item.note.subjectId] = (subjectCounts[item.note.subjectId] || 0) + 2;
      }
      if (item.note.courseId) {
        courseIds.add(item.note.courseId);
        courseCounts[item.note.courseId] = (courseCounts[item.note.courseId] || 0) + 2;
      }
      if (item.note.semester) {
        semesterIds.add(item.note.semester);
        semesterCounts[item.note.semester] = (semesterCounts[item.note.semester] || 0) + 2;
      }
    }

    // Process downloads
    for (const d of downloads) {
      if (!d.note) continue;
      if (d.note.subjectId) {
        downloadedSubjectIds.add(d.note.subjectId);
        allSubjectIds.add(d.note.subjectId);
        subjectCounts[d.note.subjectId] = (subjectCounts[d.note.subjectId] || 0) + 2;
      }
      if (d.note.courseId) {
        courseIds.add(d.note.courseId);
        courseCounts[d.note.courseId] = (courseCounts[d.note.courseId] || 0) + 2;
      }
      if (d.note.semester) {
        semesterIds.add(d.note.semester);
        semesterCounts[d.note.semester] = (semesterCounts[d.note.semester] || 0) + 2;
      }
    }

    // Process user's own uploads
    for (const up of uploads) {
      excludedNoteIds.add(up.id);
      if (up.subjectId) {
        allSubjectIds.add(up.subjectId);
        subjectCounts[up.subjectId] = (subjectCounts[up.subjectId] || 0) + 1;
      }
      if (up.courseId) {
        courseIds.add(up.courseId);
        courseCounts[up.courseId] = (courseCounts[up.courseId] || 0) + 1;
      }
      if (up.semester) {
        semesterIds.add(up.semester);
        semesterCounts[up.semester] = (semesterCounts[up.semester] || 0) + 1;
      }
    }

    // Find highest frequency subject, course, and semester
    let primarySubjectId = null;
    let maxSubj = 0;
    for (const [sId, count] of Object.entries(subjectCounts)) {
      if (count > maxSubj) {
        maxSubj = count;
        primarySubjectId = sId;
      }
    }

    let primaryCourseId = null;
    let maxCourse = 0;
    for (const [cId, count] of Object.entries(courseCounts)) {
      if (count > maxCourse) {
        maxCourse = count;
        primaryCourseId = cId;
      }
    }

    let primarySemester = null;
    let maxSem = 0;
    for (const [sem, count] of Object.entries(semesterCounts)) {
      if (count > maxSem) {
        maxSem = count;
        primarySemester = parseInt(sem, 10);
      }
    }

    const hasSignals = allSubjectIds.size > 0 || courseIds.size > 0 || semesterIds.size > 0;

    return {
      primarySubjectId,
      primaryCourseId,
      primarySemester,
      bookmarkedSubjectIds,
      collectionSubjectIds,
      downloadedSubjectIds,
      allSubjectIds,
      courseIds,
      semesterIds,
      excludedNoteIds,
      hasSignals
    };
  }

  /**
   * Bounded database query for approved candidate notes.
   *
   * @param {object} whereClause
   * @param {number} limit
   */
  async getCandidateNotes(whereClause = {}, limit = 50) {
    const notes = await prisma.note.findMany({
      where: {
        status: 'APPROVED',
        ...whereClause
      },
      orderBy: [{ downloadCount: 'desc' }, { publishedAt: 'desc' }],
      take: limit,
      include: {
        subject: { select: { id: true, name: true, slug: true } },
        course: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
        uploadedBy: { select: { id: true, name: true } }
      }
    });

    return notes.map(sanitizeNote);
  }

  /**
   * Retrieves candidate similar notes for a given target note.
   * Excludes the target note itself.
   */
  async getSimilarCandidateNotes(targetNote, limit = 20) {
    const orConditions = [];

    if (targetNote.subjectId) {
      orConditions.push({ subjectId: targetNote.subjectId });
    }
    if (targetNote.courseId) {
      orConditions.push({ courseId: targetNote.courseId });
    }
    if (targetNote.semester) {
      orConditions.push({ semester: targetNote.semester });
    }
    if (targetNote.categoryId) {
      orConditions.push({ categoryId: targetNote.categoryId });
    }

    const notes = await prisma.note.findMany({
      where: {
        status: 'APPROVED',
        id: { not: targetNote.id },
        ...(orConditions.length > 0 ? { OR: orConditions } : {})
      },
      orderBy: [{ downloadCount: 'desc' }, { viewCount: 'desc' }],
      take: limit,
      include: {
        subject: { select: { id: true, name: true, slug: true } },
        course: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
        uploadedBy: { select: { id: true, name: true } }
      }
    });

    return notes.map(sanitizeNote);
  }

  /**
   * Retrieves top popular approved notes.
   */
  async getPopularApprovedNotes(limit = 6) {
    const notes = await prisma.note.findMany({
      where: { status: 'APPROVED' },
      orderBy: [{ downloadCount: 'desc' }, { viewCount: 'desc' }],
      take: limit,
      include: {
        subject: { select: { id: true, name: true, slug: true } },
        course: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
        uploadedBy: { select: { id: true, name: true } }
      }
    });

    return notes.map(sanitizeNote);
  }

  /**
   * Retrieves recently approved public notes.
   */
  async getRecentlyApprovedNotes(limit = 6) {
    const notes = await prisma.note.findMany({
      where: { status: 'APPROVED' },
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      include: {
        subject: { select: { id: true, name: true, slug: true } },
        course: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
        uploadedBy: { select: { id: true, name: true } }
      }
    });

    return notes.map(sanitizeNote);
  }

  /**
   * Retrieves approved notes matching specific subject IDs.
   */
  async getNotesBySubjects(subjectIds = [], limit = 6) {
    if (!subjectIds || subjectIds.length === 0) return [];

    const notes = await prisma.note.findMany({
      where: {
        status: 'APPROVED',
        subjectId: { in: subjectIds }
      },
      orderBy: [{ downloadCount: 'desc' }, { publishedAt: 'desc' }],
      take: limit,
      include: {
        subject: { select: { id: true, name: true, slug: true } },
        course: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
        uploadedBy: { select: { id: true, name: true } }
      }
    });

    return notes.map(sanitizeNote);
  }
}

export const recommendationRepository = new RecommendationRepository();
export default recommendationRepository;
