import React, { useState, useEffect, useCallback } from 'react';
import reviewService from '../../services/reviewService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import RatingSummary from './RatingSummary.jsx';
import ReviewCard from './ReviewCard.jsx';
import ReviewFormDialog from './ReviewFormDialog.jsx';
import ReportReviewDialog from './ReportReviewDialog.jsx';
import Skeleton from '../common/Skeleton.jsx';
import Button from '../common/Button.jsx';
import './reviews.css';

/**
 * Complete Notes Ratings, Reviews & Quality Feedback Section.
 *
 * @param {{
 *   noteId: string,
 *   noteTitle?: string,
 *   isOwner?: boolean,
 *   isApproved?: boolean
 * }} props
 */
export function NoteReviewsSection({
  noteId,
  noteTitle = 'this manuscript',
  isOwner = false,
  isApproved = true
}) {
  const { user, isAuthenticated } = useAuth();

  const [summary, setSummary] = useState(null);
  const [reviewsData, setReviewsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Filtering & Pagination state
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('newest');

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportingReview, setReportingReview] = useState(null);

  const loadReviewsAndSummary = useCallback(async () => {
    if (!noteId) return;
    setLoading(true);
    setError('');
    try {
      const [sumData, revData] = await Promise.all([
        reviewService.getRatingSummary(noteId),
        reviewService.getNoteReviews(noteId, { page, limit: 5, sort })
      ]);
      setSummary(sumData);
      setReviewsData(revData);
    } catch (err) {
      setError(err.message || 'Unable to load reviews.');
    } finally {
      setLoading(false);
    }
  }, [noteId, page, sort]);

  useEffect(() => {
    loadReviewsAndSummary();
  }, [loadReviewsAndSummary]);

  // Find if current student has an existing review
  const userReview = reviewsData?.items?.find((r) => r.userId === user?.id);

  // Submit / Edit handler
  const handleReviewSubmit = async (payload) => {
    if (editingReview) {
      await reviewService.updateReview(noteId, editingReview.id, payload);
      setNotice('Your review has been updated.');
    } else {
      await reviewService.submitReview(noteId, payload);
      setNotice('Your review and rating have been posted.');
    }
    setEditingReview(null);
    await loadReviewsAndSummary();
  };

  // Delete review handler
  const handleReviewDelete = async (reviewId) => {
    await reviewService.deleteReview(noteId, reviewId);
    setNotice('Your review has been deleted.');
    await loadReviewsAndSummary();
  };

  // Helpful vote handler
  const handleVoteHelpful = async (reviewId) => {
    try {
      const res = await reviewService.voteHelpful(reviewId);
      setReviewsData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((r) =>
            r.id === reviewId ? { ...r, helpfulCount: res.helpfulCount, hasVotedHelpful: true } : r
          )
        };
      });
    } catch (err) {
      setError(err.message || 'Failed to record helpful vote.');
    }
  };

  // Remove helpful vote handler
  const handleRemoveHelpfulVote = async (reviewId) => {
    try {
      const res = await reviewService.removeHelpfulVote(reviewId);
      setReviewsData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((r) =>
            r.id === reviewId ? { ...r, helpfulCount: res.helpfulCount, hasVotedHelpful: false } : r
          )
        };
      });
    } catch (err) {
      setError(err.message || 'Failed to remove helpful vote.');
    }
  };

  // Report review handler
  const handleReportSubmit = async (payload) => {
    if (!reportingReview) return;
    await reviewService.reportReview(reportingReview.id, payload);
    setNotice('Review report submitted for administrative review.');
    setReportingReview(null);
  };

  const handleOpenWrite = () => {
    if (userReview) {
      setEditingReview(userReview);
    } else {
      setEditingReview(null);
    }
    setFormOpen(true);
  };

  const reviewsList = reviewsData?.items || [];
  const pagination = reviewsData?.pagination || {};

  return (
    <section className="reviews-section" aria-labelledby="ratings-reviews-heading">
      <div className="reviews-header">
        <div className="reviews-title-wrap">
          <h2 id="ratings-reviews-heading" className="reviews-title">
            Ratings & Reviews
          </h2>
          <p className="reviews-subtitle">
            Community feedback from verified scholars and peer learners.
          </p>
        </div>
      </div>

      {notice && (
        <div
          className="auth-alert auth-alert--success"
          style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}
        >
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="auth-alert auth-alert--danger" style={{ marginBottom: '20px' }}>
          <span>{error}</span>
        </div>
      )}

      {/* 1. Rating Summary Breakdown */}
      {loading && !summary ? (
        <div style={{ marginBottom: '32px' }}>
          <Skeleton height={160} />
        </div>
      ) : (
        <RatingSummary
          summary={summary}
          onWriteReview={handleOpenWrite}
          hasUserReviewed={Boolean(userReview)}
          isOwner={isOwner}
          canReview={isAuthenticated && isApproved}
        />
      )}

      {/* 2. List Controls (Sort & Total count) */}
      <div className="reviews-controls">
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
          {pagination.totalCount || 0} {pagination.totalCount === 1 ? 'Review' : 'Reviews'}
        </span>

        <div className="reviews-sort-wrap">
          <label htmlFor="review-sort-select">Sort by:</label>
          <select
            id="review-sort-select"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="reviews-sort-select"
          >
            <option value="newest">Newest First</option>
            <option value="highest_rating">Highest Rating</option>
            <option value="lowest_rating">Lowest Rating</option>
            <option value="most_helpful">Most Helpful</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>

      {/* 3. Reviews List or Skeletons / Empty State */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <Skeleton height={110} count={3} />
        </div>
      ) : reviewsList.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--color-surface-subtle, #f4f2ed)',
            border: '1px dashed var(--color-border, #e6e3dc)',
            borderRadius: '8px',
            padding: '36px 20px',
            textAlign: 'center'
          }}
        >
          <h3
            style={{
              fontFamily: 'var(--font-heading, serif)',
              fontSize: '1.25rem',
              margin: '0 0 6px 0',
              fontWeight: 400
            }}
          >
            No reviews yet
          </h3>
          <p
            style={{
              fontSize: '0.85rem',
              color: 'var(--color-text-secondary, #74756f)',
              margin: '0 0 16px 0'
            }}
          >
            Be the first eligible student to share feedback about this manuscript.
          </p>
          {isAuthenticated && !isOwner && isApproved && (
            <Button variant="primary" size="sm" onClick={handleOpenWrite}>
              ★ Write First Review
            </Button>
          )}
        </div>
      ) : (
        <div className="reviews-list">
          {reviewsList.map((rev) => (
            <ReviewCard
              key={rev.id}
              review={rev}
              onVoteHelpful={handleVoteHelpful}
              onRemoveHelpfulVote={handleRemoveHelpfulVote}
              onEdit={() => {
                setEditingReview(rev);
                setFormOpen(true);
              }}
              onDelete={handleReviewDelete}
              onReport={(targetReview) => {
                setReportingReview(targetReview);
                setReportOpen(true);
              }}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}

      {/* 4. Pagination */}
      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '28px' }}>
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ← Previous
          </Button>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.85rem',
              color: 'var(--color-text-secondary)'
            }}
          >
            Page {page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
          >
            Next →
          </Button>
        </div>
      )}

      {/* Review Form Dialog */}
      {formOpen && (
        <ReviewFormDialog
          isOpen={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditingReview(null);
          }}
          onSubmit={handleReviewSubmit}
          initialData={editingReview}
          noteTitle={noteTitle}
        />
      )}

      {/* Report Dialog */}
      {reportOpen && (
        <ReportReviewDialog
          isOpen={reportOpen}
          onClose={() => {
            setReportOpen(false);
            setReportingReview(null);
          }}
          onSubmit={handleReportSubmit}
          review={reportingReview}
        />
      )}
    </section>
  );
}

export default NoteReviewsSection;
