import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import StarRating from './StarRating.jsx';

const FEEDBACK_TAGS = [
  '✨ Crystal Clear Proofs',
  '📐 High Quality Diagrams',
  '💡 Helpful Worked Examples',
  '🎯 Exam Oriented',
  '📝 Highly Legible',
  '⚡ Great Revision Summary'
];

const RATING_TIERS = {
  5: {
    score: '5.0',
    title: 'Exceptional Quality',
    desc: 'Comprehensive, accurate, and highly recommended.',
    color: '#047857',
    bgColor: '#ECFDF5',
    borderColor: '#A7F3D0'
  },
  4: {
    score: '4.0',
    title: 'Very Good',
    desc: 'Clear coverage with solid conceptual explanations.',
    color: '#0F766E',
    bgColor: '#F0FDFA',
    borderColor: '#99F6E4'
  },
  3: {
    score: '3.0',
    title: 'Satisfactory',
    desc: 'Covers core topics adequately; minor gaps.',
    color: '#B45309',
    bgColor: '#FFFBEB',
    borderColor: '#FDE68A'
  },
  2: {
    score: '2.0',
    title: 'Needs Improvement',
    desc: 'Lacks detail or missing essential derivations.',
    color: '#C2410C',
    bgColor: '#FFF7ED',
    borderColor: '#FFEDD5'
  },
  1: {
    score: '1.0',
    title: 'Incomplete / Inaccurate',
    desc: 'Requires major revisions or corrections.',
    color: '#BE123C',
    bgColor: '#FFF1F2',
    borderColor: '#FECDD3'
  }
};

/**
 * Editorial modal dialog for writing or editing an academic note review.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onSubmit: (payload: { rating: number, comment?: string }) => Promise<void>,
 *   initialData?: { rating: number, comment?: string } | null,
 *   noteTitle?: string
 * }} props
 */
export function ReviewFormDialog({
  isOpen,
  onClose,
  onSubmit,
  initialData = null,
  noteTitle = 'this manuscript'
}) {
  const [rating, setRating] = useState(initialData?.rating || 0);
  const [comment, setComment] = useState(initialData?.comment || '');
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRating(initialData?.rating || 0);
      setComment(initialData?.comment || '');
      setSelectedTags(new Set());
      setError('');
    }
  }, [isOpen, initialData]);

  const toggleTag = (tag) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) {
        next.delete(tag);
        // Remove tag from comment if present
        setComment((curr) => curr.replace(`[${tag}] `, '').replace(`[${tag}]`, '').trim());
      } else {
        next.add(tag);
        // Prepend tag to comment
        setComment((curr) => (curr ? `[${tag}] ${curr}` : `[${tag}] `));
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!rating || rating < 1 || rating > 5) {
      setError('Please select an overall rating from 1 to 5 stars.');
      return;
    }

    if (comment.length > 2000) {
      setError('Review critique cannot exceed 2,000 characters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        rating,
        comment: comment.trim() || undefined
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = Boolean(initialData?.rating);
  const currentTier = RATING_TIERS[rating];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Manuscript Review' : 'Rate & Review Manuscript'}
      maxWidth="540px"
    >
      <form onSubmit={handleSubmit} className="review-dialog-form">
        {/* Manuscript Context Header Pill */}
        <div className="review-dialog-context">
          <div className="review-dialog-context__icon">📖</div>
          <div className="review-dialog-context__info">
            <span className="review-dialog-context__label">Peer Academic Review</span>
            <h4 className="review-dialog-context__title" title={noteTitle}>
              {noteTitle}
            </h4>
          </div>
        </div>

        {error && (
          <div className="review-dialog-alert" role="alert">
            <span className="review-dialog-alert__icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Rating Section with Tactile Stars and Live Tier Indicator */}
        <div className="review-dialog-rating-card">
          <div className="review-dialog-rating-card__top">
            <span className="review-dialog-rating-card__title">
              Overall Academic Quality <span className="review-dialog-rating-card__req">*</span>
            </span>
            <span className="review-dialog-rating-card__hint">
              {rating > 0 ? `${rating} of 5 stars` : 'Select score'}
            </span>
          </div>

          <div className="review-dialog-stars-wrap">
            <StarRating
              value={rating}
              onChange={(val) => {
                setRating(val);
                setError('');
              }}
              readOnly={false}
              size="xl"
            />
          </div>

          {currentTier ? (
            <div
              className="review-dialog-tier-badge"
              style={{
                color: currentTier.color,
                backgroundColor: currentTier.bgColor,
                borderColor: currentTier.borderColor
              }}
            >
              <div className="review-dialog-tier-badge__score">{currentTier.score}</div>
              <div className="review-dialog-tier-badge__text">
                <strong>{currentTier.title}</strong> — {currentTier.desc}
              </div>
            </div>
          ) : (
            <div className="review-dialog-tier-badge review-dialog-tier-badge--empty">
              <span>Click a star to evaluate this manuscript from 1 to 5</span>
            </div>
          )}
        </div>

        {/* Quick Praise Impression Chips */}
        <div className="review-dialog-tags-section">
          <label className="review-dialog-label">
            Quick Impression Tags <span className="review-dialog-label-opt">(Optional)</span>
          </label>
          <div className="review-dialog-tags-list">
            {FEEDBACK_TAGS.map((tag) => {
              const active = selectedTags.has(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`review-dialog-tag-chip ${
                    active ? 'review-dialog-tag-chip--active' : ''
                  }`}
                  aria-pressed={active}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Written Critique Section */}
        <div className="review-dialog-field">
          <div className="review-dialog-field-header">
            <label htmlFor="review-critique-input" className="review-dialog-label">
              Your Written Critique <span className="review-dialog-label-opt">(Optional)</span>
            </label>
            <span
              className={`review-dialog-counter ${
                comment.length > 2000 ? 'review-dialog-counter--danger' : ''
              }`}
            >
              {comment.length.toLocaleString()} / 2,000
            </span>
          </div>

          <textarea
            id="review-critique-input"
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share what you found most helpful (e.g. proof clarity, lecture syllabus alignment, worked formulas, or areas for revision)..."
            className="review-dialog-textarea"
            maxLength={2050}
          />
        </div>

        {/* Modal Actions Footer */}
        <div className="review-dialog-actions">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="review-dialog-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="review-dialog-submit-btn"
          >
            {isSubmitting ? (
              'Submitting...'
            ) : isEditing ? (
              '✓ Update Review'
            ) : (
              '✓ Post Scholar Review'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ReviewFormDialog;
