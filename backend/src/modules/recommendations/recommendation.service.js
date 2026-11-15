import recommendationRepository from './recommendation.repository.js';
import {
  calculateRecommendationScore,
  calculateSimilarNoteScore
} from './recommendation.scoring.js';
import { RECOMMENDATION_LIMITS, RECOMMENDATION_REASONS } from './recommendation.config.js';
import prisma from '../../config/database.js';

export class RecommendationService {
  constructor(repo = recommendationRepository) {
    this.repo = repo;
  }

  /**
   * Generates explainable, personalized recommendations for an authenticated student.
   * Gracefully falls back to general discovery for cold-start scholars.
   *
   * @param {string} userId
   * @param {{ limit?: number }} options
   */
  async getPersonalizedRecommendations(userId, options = {}) {
    const rawLimit = parseInt(String(options.limit || ''), 10);
    const limit =
      !Number.isNaN(rawLimit) && rawLimit > 0
        ? Math.min(rawLimit, RECOMMENDATION_LIMITS.MAX_LIMIT)
        : RECOMMENDATION_LIMITS.DEFAULT_LIMIT;

    const context = await this.repo.getUserPersonalizationContext(userId);

    // COLD-START FALLBACK: If user has 0 historical activity signals
    if (!context.hasSignals) {
      const popularNotes = await this.repo.getPopularApprovedNotes(limit);
      return {
        personalized: false,
        fallback: true,
        message:
          'Explore subjects and save notes to help PJ Study personalize your academic recommendations.',
        recommendations: popularNotes.map((note) => ({
          note,
          reason:
            note.downloadCount >= 5
              ? RECOMMENDATION_REASONS.POPULAR(note.downloadCount)
              : RECOMMENDATION_REASONS.DISCOVERY,
          score: note.downloadCount || 0
        }))
      };
    }

    // Candidate generation with database filters
    const excludeIds = Array.from(context.excludedNoteIds);
    let candidates = await this.repo.getCandidateNotes(
      {
        id: excludeIds.length > 0 ? { notIn: excludeIds } : undefined
      },
      RECOMMENDATION_LIMITS.CANDIDATE_POOL_SIZE
    );

    // If candidate set is sparse, broaden to any approved notes
    if (candidates.length < limit) {
      const additional = await this.repo.getPopularApprovedNotes(limit * 2);
      const existingIds = new Set(candidates.map((c) => c.id));
      for (const note of additional) {
        if (!existingIds.has(note.id) && !context.excludedNoteIds.has(note.id)) {
          candidates.push(note);
          existingIds.add(note.id);
        }
      }
    }

    // Deterministic scoring of each candidate
    const scoredCandidates = candidates.map((note) => {
      const { score, reason, reasons } = calculateRecommendationScore(note, context);
      return {
        note,
        score,
        reason,
        reasons
      };
    });

    // Deterministic sort: score DESC, downloadCount DESC, publishedAt DESC, id ASC
    scoredCandidates.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if ((b.note.downloadCount || 0) !== (a.note.downloadCount || 0)) {
        return (b.note.downloadCount || 0) - (a.note.downloadCount || 0);
      }
      const bTime = new Date(b.note.publishedAt || b.note.createdAt).getTime();
      const aTime = new Date(a.note.publishedAt || a.note.createdAt).getTime();
      if (bTime !== aTime) return bTime - aTime;
      return a.note.id.localeCompare(b.note.id);
    });

    // Apply subject diversity filter to prevent single subject saturation
    const finalRecommendations = [];
    const subjectCounts = {};

    for (const item of scoredCandidates) {
      const subjId = item.note.subjectId || 'unknown';
      const count = subjectCounts[subjId] || 0;

      if (count < RECOMMENDATION_LIMITS.MAX_PER_SUBJECT_DIVERSITY) {
        finalRecommendations.push(item);
        subjectCounts[subjId] = count + 1;
      }

      if (finalRecommendations.length >= limit) break;
    }

    // If diversity filter resulted in fewer than requested, backfill remaining
    if (finalRecommendations.length < limit) {
      const selectedIds = new Set(finalRecommendations.map((r) => r.note.id));
      for (const item of scoredCandidates) {
        if (!selectedIds.has(item.note.id)) {
          finalRecommendations.push(item);
          selectedIds.add(item.note.id);
        }
        if (finalRecommendations.length >= limit) break;
      }
    }

    return {
      personalized: true,
      fallback: false,
      matchedSignals: {
        subjectsCount: context.allSubjectIds.size,
        coursesCount: context.courseIds.size,
        primarySubjectId: context.primarySubjectId
      },
      recommendations: finalRecommendations
    };
  }

  /**
   * Retrieves similar accessible notes for Note Details page.
   *
   * @param {string} noteId
   * @param {number} [limit=4]
   */
  async getSimilarNotes(noteId, limit = RECOMMENDATION_LIMITS.SIMILAR_NOTES_LIMIT) {
    if (!noteId) {
      const error = new Error('Note ID is required to retrieve similar notes.');
      error.statusCode = 400;
      throw error;
    }

    const targetNote = await prisma.note.findUnique({
      where: { id: noteId },
      include: {
        subject: { select: { id: true, name: true } },
        course: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } }
      }
    });

    if (!targetNote) {
      const error = new Error(`Note with ID "${noteId}" not found.`);
      error.statusCode = 404;
      throw error;
    }

    const candidates = await this.repo.getSimilarCandidateNotes(targetNote, limit * 4);

    const scored = candidates
      .map((cand) => {
        const { score, reason } = calculateSimilarNoteScore(cand, targetNote);
        return {
          note: cand,
          score,
          reason
        };
      })
      .filter((item) => item.score > 0);

    // Sort by score DESC, downloadCount DESC, publishedAt DESC
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return (b.note.downloadCount || 0) - (a.note.downloadCount || 0);
    });

    return {
      targetNoteId: noteId,
      similarNotes: scored.slice(0, limit)
    };
  }

  /**
   * Retrieves notes for student's active subjects.
   *
   * @param {string} userId
   * @param {number} [limit=6]
   */
  async getSubjectBasedRecommendations(userId, limit = 6) {
    const context = await this.repo.getUserPersonalizationContext(userId);
    const subjectIds = Array.from(context.allSubjectIds);

    if (subjectIds.length === 0) {
      // Fallback: return popular notes
      const fallback = await this.repo.getPopularApprovedNotes(limit);
      return {
        hasSubjects: false,
        recommendations: fallback.map((note) => ({
          note,
          reason: 'Popular in academic catalog'
        }))
      };
    }

    const notes = await this.repo.getNotesBySubjects(subjectIds, limit);
    return {
      hasSubjects: true,
      recommendations: notes.map((note) => ({
        note,
        reason: `Based on your interest in ${note.subject?.name || 'this subject'}`
      }))
    };
  }

  /**
   * Retrieves recently approved public notes.
   *
   * @param {number} [limit=6]
   */
  async getRecentRecommendations(limit = 6) {
    const notes = await this.repo.getRecentlyApprovedNotes(limit);
    return {
      recommendations: notes.map((note) => ({
        note,
        reason: 'Recently reviewed and added to catalog'
      }))
    };
  }

  /**
   * Retrieves popular notes.
   *
   * @param {number} [limit=6]
   */
  async getPopularRecommendations(limit = 6) {
    const notes = await this.repo.getPopularApprovedNotes(limit);
    return {
      recommendations: notes.map((note) => ({
        note,
        reason:
          note.downloadCount >= 5
            ? `Popular (${note.downloadCount} downloads)`
            : 'Popular study guide'
      }))
    };
  }
}

export const recommendationService = new RecommendationService();
export default recommendationService;
