import React from 'react';
import StarRating from './StarRating.jsx';
import Button from '../common/Button.jsx';

/**
 * Editorial rating metrics summary and distribution display.
 *
 * @param {{
 *   summary: {
 *     averageRating: number,
 *     totalRatings: number,
 *     distribution: { 1: number, 2: number, 3: number, 4: number, 5: number }
 *   },
 *   onWriteReview?: () => void,
 *   hasUserReviewed?: boolean,
 *   isOwner?: boolean,
 *   canReview?: boolean
 * }} props
 */
export function RatingSummary({
  summary = {
    averageRating: 0,
    totalRatings: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  },
  onWriteReview = null,
  hasUserReviewed = false,
  isOwner = false,
  canReview = true
}) {
  const { averageRating = 0, totalRatings = 0, distribution = {} } = summary;

  return (
    <div className="rating-summary-card">
      <div className="rating-score-box">
        {totalRatings > 0 ? (
          <>
            <span className="rating-score-number">{averageRating.toFixed(1)}</span>
            <StarRating value={Math.round(averageRating)} readOnly size="md" />
            <span className="rating-score-total">
              Based on {totalRatings} {totalRatings === 1 ? 'review' : 'reviews'}
            </span>
          </>
        ) : (
          <>
            <span
              style={{
                fontSize: '1.25rem',
                fontFamily: 'var(--font-heading, serif)',
                color: 'var(--color-text-secondary, #74756f)'
              }}
            >
              No reviews yet
            </span>
            <StarRating value={0} readOnly size="md" />
            <span className="rating-score-total">Be the first to rate this manuscript</span>
          </>
        )}

        {canReview && !isOwner && onWriteReview && (
          <div style={{ marginTop: '12px', width: '100%' }}>
            <Button
              variant={hasUserReviewed ? 'outline' : 'primary'}
              size="sm"
              onClick={onWriteReview}
              style={{ width: '100%' }}
            >
              {hasUserReviewed ? '✏ Edit Your Review' : '★ Write a Review'}
            </Button>
          </div>
        )}
      </div>

      <div className="rating-distribution-list">
        {[5, 4, 3, 2, 1].map((stars) => {
          const count = distribution[stars] || 0;
          const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;

          return (
            <div key={stars} className="rating-dist-row">
              <span className="rating-dist-label">
                {stars} {stars === 1 ? 'Star' : 'Stars'}
              </span>
              <div
                className="rating-dist-bar-bg"
                role="progressbar"
                aria-valuenow={percentage}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label={`${stars} stars: ${count} reviews`}
              >
                <div className="rating-dist-bar-fill" style={{ width: `${percentage}%` }} />
              </div>
              <span className="rating-dist-count">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RatingSummary;
