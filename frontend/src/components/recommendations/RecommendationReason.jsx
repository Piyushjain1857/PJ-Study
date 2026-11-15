import React from 'react';

/**
 * Editorial badge rendering explainable recommendation reason.
 *
 * @param {{
 *   reason: string,
 *   score?: number
 * }} props
 */
export function RecommendationReason({ reason, score }) {
  if (!reason) return null;

  // Determine variant from reason content
  let variant = 'default';
  const lower = reason.toLowerCase();
  if (lower.includes('subject') || lower.includes('same subject')) {
    variant = 'subject';
  } else if (
    lower.includes('curriculum') ||
    lower.includes('course') ||
    lower.includes('semester')
  ) {
    variant = 'course';
  } else if (
    lower.includes('bookmark') ||
    lower.includes('collection') ||
    lower.includes('saved')
  ) {
    variant = 'bookmark';
  } else if (
    lower.includes('popular') ||
    lower.includes('trending') ||
    lower.includes('download')
  ) {
    variant = 'popular';
  }

  return (
    <span
      className={`rec-reason-pill rec-reason-pill--${variant}`}
      title={score !== undefined ? `Relevance Score: ${score}` : undefined}
    >
      <span aria-hidden="true">✦</span>
      <span>{reason}</span>
    </span>
  );
}

export default RecommendationReason;
