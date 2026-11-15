import { RECOMMENDATION_WEIGHTS, RECOMMENDATION_REASONS } from './recommendation.config.js';

/**
 * Calculates a deterministic recommendation score and explanation for a candidate note.
 *
 * @param {object} note Candidate note record
 * @param {object} context Student personalization context
 * @returns {{ score: number, reason: string, reasons: string[] }}
 */
export function calculateRecommendationScore(note, context = {}) {
  let score = 0;
  const reasons = [];

  const subjectName = note.subject?.name || 'this subject';
  const courseName = note.course?.name || 'your course';

  // 1. Same subject as student's primary active subject
  if (context.primarySubjectId && note.subjectId === context.primarySubjectId) {
    score += RECOMMENDATION_WEIGHTS.SAME_SUBJECT;
    reasons.push(RECOMMENDATION_REASONS.SAME_SUBJECT(subjectName));
  } else if (context.bookmarkedSubjectIds?.has(note.subjectId)) {
    // 2. Subject from previous bookmarks
    score += RECOMMENDATION_WEIGHTS.BOOKMARKED_SUBJECT;
    reasons.push(RECOMMENDATION_REASONS.SAVED_SUBJECT(subjectName));
  } else if (context.downloadedSubjectIds?.has(note.subjectId)) {
    // 3. Subject from previous downloads
    score += RECOMMENDATION_WEIGHTS.DOWNLOADED_SUBJECT;
    reasons.push(RECOMMENDATION_REASONS.DOWNLOADED_SUBJECT(subjectName));
  } else if (context.collectionSubjectIds?.has(note.subjectId)) {
    // 4. Subject from collections
    score += RECOMMENDATION_WEIGHTS.COLLECTION_SUBJECT;
    reasons.push(RECOMMENDATION_REASONS.SAVED_SUBJECT(subjectName));
  }

  // 5. Course match
  if (context.primaryCourseId && note.courseId === context.primaryCourseId) {
    score += RECOMMENDATION_WEIGHTS.SAME_COURSE;
    reasons.push(RECOMMENDATION_REASONS.SAME_COURSE(courseName));
  } else if (context.courseIds?.has(note.courseId)) {
    score += Math.round(RECOMMENDATION_WEIGHTS.SAME_COURSE * 0.5);
    reasons.push(RECOMMENDATION_REASONS.SAME_COURSE(courseName));
  }

  // 6. Semester match
  if (context.primarySemester && note.semester === context.primarySemester) {
    score += RECOMMENDATION_WEIGHTS.SAME_SEMESTER;
    reasons.push(RECOMMENDATION_REASONS.SAME_SEMESTER(note.semester));
  } else if (context.semesterIds?.has(note.semester)) {
    score += Math.round(RECOMMENDATION_WEIGHTS.SAME_SEMESTER * 0.5);
    reasons.push(RECOMMENDATION_REASONS.SAME_SEMESTER(note.semester));
  }

  // 7. Recently approved content (within last 30 days)
  const publishedDate = note.publishedAt || note.createdAt;
  if (publishedDate) {
    const daysSincePublished =
      (Date.now() - new Date(publishedDate).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePublished >= 0 && daysSincePublished <= 30) {
      score += RECOMMENDATION_WEIGHTS.RECENTLY_APPROVED;
      if (reasons.length === 0) {
        reasons.push(RECOMMENDATION_REASONS.RECENT);
      }
    }
  }

  // 8. Popularity score (bounded logarithmically)
  const downloads = note.downloadCount || 0;
  const views = note.viewCount || 0;
  const rawPopularity = downloads * 2 + views;
  if (rawPopularity > 0) {
    const popScore = Math.min(
      RECOMMENDATION_WEIGHTS.POPULARITY_MAX,
      Math.round(Math.log10(rawPopularity + 1) * 3)
    );
    score += popScore;
    if (downloads >= 5 && reasons.length < 2) {
      reasons.push(RECOMMENDATION_REASONS.POPULAR(downloads));
    }
  }

  // 9. Verified review rating quality signal (conservative, requires multiple reviews)
  const avgRating = Number(note.averageRating || 0);
  const totalReviews = Number(note.totalReviews || 0);
  if (avgRating >= 3.5 && totalReviews >= 2) {
    const qualityScore = Math.min(
      RECOMMENDATION_WEIGHTS.RATING_QUALITY_MAX || 10,
      Math.round(((avgRating - 3.0) / 2.0) * Math.min(totalReviews, 5) * 2)
    );
    score += qualityScore;
    if (avgRating >= 4.0 && reasons.length < 2) {
      reasons.push(`Highly rated by scholars (★ ${avgRating.toFixed(1)})`);
    }
  }

  // Primary explanation fallback
  const primaryReason = reasons[0] || RECOMMENDATION_REASONS.DISCOVERY;

  return {
    score,
    reason: primaryReason,
    reasons
  };
}

/**
 * Calculates similarity score between a target note and a candidate note.
 *
 * @param {object} candidate Candidate note
 * @param {object} target Target note being viewed
 * @returns {{ score: number, reason: string }}
 */
export function calculateSimilarNoteScore(candidate, target) {
  let score = 0;
  const reasons = [];

  // Exclude identical note
  if (candidate.id === target.id) {
    return { score: -1, reason: '' };
  }

  // Exact same subject (+40)
  if (candidate.subjectId && candidate.subjectId === target.subjectId) {
    score += 40;
    reasons.push(RECOMMENDATION_REASONS.SAME_SUBJECT(target.subject?.name || 'this subject'));
  }

  // Same course (+25)
  if (candidate.courseId && candidate.courseId === target.courseId) {
    score += 25;
    reasons.push(RECOMMENDATION_REASONS.SAME_COURSE(target.course?.name || 'this program'));
  }

  // Same semester (+15)
  if (candidate.semester && candidate.semester === target.semester) {
    score += 15;
    reasons.push(RECOMMENDATION_REASONS.SAME_SEMESTER(target.semester));
  }

  // Same category (+10)
  if (candidate.categoryId && candidate.categoryId === target.categoryId) {
    score += 10;
    reasons.push(RECOMMENDATION_REASONS.SAME_CATEGORY(target.category?.name || 'this format'));
  }

  // Popularity (+1 to +10)
  const downloads = candidate.downloadCount || 0;
  if (downloads > 0) {
    score += Math.min(10, Math.round(Math.log10(downloads + 1) * 4));
  }

  const primaryReason =
    reasons[0] ||
    (downloads >= 5 ? RECOMMENDATION_REASONS.POPULAR(downloads) : RECOMMENDATION_REASONS.DISCOVERY);

  return {
    score,
    reason: primaryReason
  };
}
