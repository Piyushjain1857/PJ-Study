import React, { useState } from 'react';
import Avatar from '../common/Avatar.jsx';
import Badge from '../common/Badge.jsx';
import StarRating from './StarRating.jsx';

/**
 * Editorial card presenting a single student review with helpful voting & report actions.
 *
 * @param {{
 *   review: object,
 *   onVoteHelpful?: (reviewId: string) => void,
 *   onRemoveHelpfulVote?: (reviewId: string) => void,
 *   onEdit?: (review: object) => void,
 *   onDelete?: (reviewId: string) => void,
 *   onReport?: (review: object) => void,
 *   currentUserId?: string
 * }} props
 */
export function ReviewCard({
  review,
  onVoteHelpful = null,
  onRemoveHelpfulVote = null,
  onEdit = null,
  onDelete = null,
  onReport = null,
  currentUserId = null
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    id,
    user,
    rating,
    comment,
    createdAt,
    updatedAt,
    helpfulCount = 0,
    hasVotedHelpful = false,
    isOwner = false
  } = review;

  const displayDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const isEdited = new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 60000;

  const handleHelpfulToggle = () => {
    if (isOwner) return;
    if (hasVotedHelpful) {
      if (onRemoveHelpfulVote) onRemoveHelpfulVote(id);
    } else {
      if (onVoteHelpful) onVoteHelpful(id);
    }
  };

  const handleDeleteClick = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setIsDeleting(true);
    try {
      if (onDelete) await onDelete(id);
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="review-card">
      <div className="review-card-top">
        <div className="review-card-author">
          <Avatar name={user?.name || 'Scholar'} size="sm" />
          <div className="review-card-author-info">
            <span className="review-card-author-name">
              {user?.name || 'Academic Scholar'}
              {user?.role && user.role !== 'STUDENT' && (
                <Badge variant="accent" size="sm">
                  {user.role}
                </Badge>
              )}
            </span>
            <span className="review-card-date">
              {displayDate}
              {isEdited && ' • Edited'}
            </span>
          </div>
        </div>

        <StarRating value={rating} readOnly size="sm" />
      </div>

      {comment && <p className="review-card-body">{comment}</p>}

      <div className="review-card-bottom">
        <button
          type="button"
          onClick={handleHelpfulToggle}
          disabled={isOwner || !currentUserId}
          title={
            !currentUserId
              ? 'Sign in to vote'
              : isOwner
                ? 'You cannot vote your own review as helpful'
                : hasVotedHelpful
                  ? 'Remove helpful vote'
                  : 'Mark review as helpful'
          }
          className={`review-card-helpful-btn ${
            hasVotedHelpful ? 'review-card-helpful-btn--voted' : ''
          }`}
          aria-label={`Mark as helpful, currently ${helpfulCount} votes`}
        >
          <span>👍</span>
          <span>Helpful ({helpfulCount})</span>
        </button>

        <div className="review-card-actions">
          {isOwner ? (
            <>
              {onEdit && (
                <button type="button" onClick={() => onEdit(review)} className="review-action-link">
                  Edit
                </button>
              )}
              {confirmDelete ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                    className="review-action-link review-action-link--danger"
                  >
                    {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="review-action-link"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="review-action-link review-action-link--danger"
                >
                  Delete
                </button>
              )}
            </>
          ) : (
            currentUserId &&
            onReport && (
              <button
                type="button"
                onClick={() => onReport(review)}
                className="review-action-link"
                aria-label="Report review as inappropriate"
              >
                Report
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default ReviewCard;
