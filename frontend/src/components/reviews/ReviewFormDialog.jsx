import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import StarRating from './StarRating.jsx';

/**
 * Modal dialog for writing or editing an academic note review.
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
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRating(initialData?.rating || 0);
      setComment(initialData?.comment || '');
      setError('');
    }
  }, [isOpen, initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!rating || rating < 1 || rating > 5) {
      setError('Please select a star rating from 1 to 5.');
      return;
    }

    if (comment.length > 2000) {
      setError('Review comment cannot exceed 2,000 characters.');
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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Your Review' : 'Rate & Review Manuscript'}
      description={`Share your constructive feedback on "${noteTitle}".`}
      maxWidth="500px"
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}
      >
        {error && (
          <div className="auth-alert auth-alert--danger" style={{ margin: 0 }}>
            <span>{error}</span>
          </div>
        )}

        <div>
          <label
            htmlFor="star-rating-label"
            style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}
          >
            Your Rating <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <StarRating
              value={rating}
              onChange={(val) => {
                setRating(val);
                setError('');
              }}
              readOnly={false}
              size="lg"
            />
            {rating > 0 && (
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  color: 'var(--color-text-secondary)'
                }}
              >
                {rating === 1 && 'Poor'}
                {rating === 2 && 'Fair'}
                {rating === 3 && 'Good'}
                {rating === 4 && 'Very Good'}
                {rating === 5 && 'Excellent'}
              </span>
            )}
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label htmlFor="review-comment-input" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
              Your Written Critique{' '}
              <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#74756f' }}>
                (Optional)
              </span>
            </label>
            <span
              style={{ fontSize: '0.75rem', color: comment.length > 2000 ? '#dc2626' : '#74756f' }}
            >
              {comment.length} / 2,000
            </span>
          </div>
          <textarea
            id="review-comment-input"
            rows={5}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you find useful about these notes? (e.g. proof clarity, lecture coverage, worked examples...)"
            className="note-form__textarea"
            maxLength={2100}
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting}>
            {isEditing ? 'Save Changes' : 'Post Review'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ReviewFormDialog;
