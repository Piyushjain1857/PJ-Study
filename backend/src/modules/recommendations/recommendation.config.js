/**
 * PJ Study Smart Notes Recommendation Configuration
 * Centralized weights, limits, and tuning parameters.
 * No magic numbers scattered across business logic.
 */

export const RECOMMENDATION_WEIGHTS = Object.freeze({
  // Direct academic syllabus matches
  SAME_COURSE: 30,
  SAME_SEMESTER: 25,
  SAME_SUBJECT: 25,

  // Student behavioral signals
  BOOKMARKED_SUBJECT: 15,
  COLLECTION_SUBJECT: 10,
  DOWNLOADED_SUBJECT: 10,

  // Metadata & discovery signals
  SAME_CATEGORY: 10,
  RECENTLY_APPROVED: 5,
  POPULARITY_MAX: 10,
  RATING_QUALITY_MAX: 10
});

export const RECOMMENDATION_LIMITS = Object.freeze({
  DEFAULT_LIMIT: 6,
  MAX_LIMIT: 24,
  CANDIDATE_POOL_SIZE: 50,
  SIMILAR_NOTES_LIMIT: 4,
  MAX_PER_SUBJECT_DIVERSITY: 3 // Prevent single subject from dominating
});

export const RECOMMENDATION_REASONS = Object.freeze({
  SAME_SUBJECT: (name) => `Direct syllabus match for ${name}`,
  SAVED_SUBJECT: (name) => `Based on notes you saved in ${name}`,
  DOWNLOADED_SUBJECT: (name) => `Related to your downloaded ${name} guides`,
  SAME_COURSE: (name) => `Curated for your program in ${name}`,
  SAME_SEMESTER: (sem) => `Essential study guide for Semester ${sem}`,
  SAME_CATEGORY: (cat) => `Shared format in ${cat}`,
  POPULAR: (downloads) =>
    downloads && downloads > 5
      ? `Popular among scholars (${downloads} downloads)`
      : 'Top rated peer study material',
  RECENT: 'Recently reviewed and approved by moderators',
  DISCOVERY: 'Recommended academic resource from the catalog'
});
