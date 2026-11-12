import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import noteService from '../../services/noteService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Avatar from '../../components/common/Avatar.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import NoteStatusBadge from '../../components/notes/NoteStatusBadge.jsx';
import Container from '../../components/layout/Container.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import './NoteDetailsPage.css';
import '../../styles/notes.css';

/**
 * Editorial academic note manuscript reader and review details.
 */
export function NoteDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isModerator, isAdmin, isSuperAdmin } = useAuth();

  const [note, setNote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  // Moderation state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    async function loadNote() {
      setIsLoading(true);
      setError('');
      try {
        const data = await noteService.getNoteById(id);
        setNote(data);
      } catch (err) {
        setError(
          err.response?.data?.error?.message ||
            err.message ||
            'Unable to access this study note manuscript.'
        );
      } finally {
        setIsLoading(false);
      }
    }
    loadNote();
  }, [id]);

  const canModerate =
    (isModerator || isAdmin || isSuperAdmin) &&
    (note?.status === 'PENDING' || note?.status === 'PENDING_REVIEW') &&
    note?.uploadedById !== user?.id;

  const isOwner = user && note?.uploadedById === user.id;

  // Approve submission
  async function handleApprove() {
    setIsReviewing(true);
    setActionNotice('');
    try {
      const updated = await noteService.reviewNote(id, { status: 'APPROVED' });
      setNote(updated);
      setActionNotice('Manuscript approved and published to the public library.');
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to approve note.');
    } finally {
      setIsReviewing(false);
    }
  }

  // Reject submission
  async function handleReject() {
    if (!rejectionReason.trim()) return;
    setIsReviewing(true);
    setActionNotice('');
    try {
      const updated = await noteService.reviewNote(id, {
        status: 'REJECTED',
        reason: rejectionReason.trim()
      });
      setNote(updated);
      setRejectModalOpen(false);
      setActionNotice('Manuscript rejected with feedback for author revision.');
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to reject note.');
    } finally {
      setIsReviewing(false);
    }
  }

  // Download file handler
  async function handleDownload() {
    if (!note?.fileName) return;
    setIsDownloading(true);
    try {
      await noteService.downloadFile(note.id, note.fileName);
    } catch (err) {
      setError(
        err.response?.data?.error?.message || err.message || 'Failed to download study document.'
      );
    } finally {
      setIsDownloading(false);
    }
  }

  function formatBytes(bytes) {
    if (!bytes) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  if (isLoading) {
    return (
      <div className="notes-page">
        <Container size="md">
          <Skeleton width="120px" height="24px" style={{ marginBottom: '16px' }} />
          <Skeleton width="80%" height="48px" style={{ marginBottom: '16px' }} />
          <Skeleton count={6} height="20px" style={{ marginBottom: '12px' }} />
        </Container>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="notes-page">
        <Container size="md">
          <div className="note-form__alert note-form__alert--danger" role="alert">
            {error || 'Study note manuscript was not found.'}
          </div>
          <div style={{ marginTop: '20px' }}>
            <Button variant="outline" onClick={() => navigate(-1)}>
              ← Go Back
            </Button>
          </div>
        </Container>
      </div>
    );
  }

  const displayDate = new Date(note.publishedAt || note.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="notes-page note-details-page">
      <Container size="md">
        {/* Navigation Breadcrumb */}
        <nav className="note-details__breadcrumb">
          <button type="button" className="note-details__back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <span className="note-details__crumb-sep">/</span>
          <Link to="/notes" className="note-details__crumb-link">
            Notes Library
          </Link>
          {note.subject && (
            <>
              <span className="note-details__crumb-sep">/</span>
              <span className="note-details__crumb-curr">{note.subject.name}</span>
            </>
          )}
        </nav>

        {/* Action Notice */}
        {actionNotice && (
          <div
            className="note-form__alert note-form__alert--success"
            style={{
              backgroundColor: '#eef8f2',
              color: '#1b633b',
              border: '1px solid #bbf7d0',
              marginBottom: '24px'
            }}
            role="status"
          >
            {actionNotice}
          </div>
        )}

        {/* Rejection feedback banner if viewing rejected note */}
        {note.status === 'REJECTED' && note.rejectionReason && (
          <div
            className="note-card__feedback"
            style={{ marginBottom: '28px', padding: '16px 20px' }}
          >
            <span className="note-card__feedback-label" style={{ fontSize: '0.875rem' }}>
              Revision Feedback from Academic Reviewer:
            </span>
            <p
              className="note-card__feedback-text"
              style={{ fontSize: '0.9375rem', marginTop: '6px' }}
            >
              {note.rejectionReason}
            </p>
            {isOwner && (
              <div style={{ marginTop: '12px' }}>
                <Link to={`/notes/${note.id}/edit`}>
                  <Button size="sm" variant="primary">
                    Edit & Address Feedback
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Manuscript Header */}
        <header className="note-details__header">
          <div className="note-details__badges">
            {note.category && <span className="note-card__category">{note.category.name}</span>}
            {note.subject && <span className="note-card__subject">{note.subject.name}</span>}
            {note.semester && <span className="note-card__semester">Semester {note.semester}</span>}
            <NoteStatusBadge status={note.status} />
          </div>

          <h1 className="note-details__title">{note.title}</h1>

          {note.description && <p className="note-details__abstract">{note.description}</p>}

          {/* Author and Metadata Bar */}
          <div className="note-details__meta-bar">
            <div className="note-details__author">
              <Avatar
                name={note.uploadedBy?.name || 'Scholar'}
                src={note.uploadedBy?.avatarUrl}
                size="md"
              />
              <div>
                <span className="note-details__author-name">
                  {note.uploadedBy?.name || 'Academic Scholar'}
                </span>
                <span className="note-details__author-date">
                  {note.status === 'APPROVED' ? 'Published' : 'Uploaded'} on {displayDate}
                </span>
              </div>
            </div>

            <div className="note-details__counters">
              <span>👁 {note.viewCount || 0} views</span>
              {note.downloadCount > 0 && <span>📥 {note.downloadCount} downloads</span>}
            </div>
          </div>
        </header>

        {/* Moderation Review Action Bar (Staff Only) */}
        {canModerate && (
          <aside className="note-details__moderation-bar">
            <div className="note-details__moderation-info">
              <strong>Academic Review Required:</strong> This manuscript is pending your moderation
              decision.
            </div>
            <div className="note-details__moderation-btns">
              <Button variant="primary" onClick={handleApprove} disabled={isReviewing}>
                {isReviewing ? 'Processing...' : '✓ Approve Manuscript'}
              </Button>
              <Button
                variant="danger"
                onClick={() => setRejectModalOpen(true)}
                disabled={isReviewing}
              >
                ✕ Request Revision
              </Button>
            </div>
          </aside>
        )}

        {/* Attached Document File Card */}
        {note.fileName && (
          <section className="note-details__file-card">
            <div className="note-details__file-icon" aria-hidden="true">
              📑
            </div>
            <div className="note-details__file-info">
              <span className="note-details__file-name">{note.fileName}</span>
              <span className="note-details__file-meta">
                {note.mimeType} {note.fileSize && `• ${formatBytes(Number(note.fileSize))}`}
              </span>
            </div>
            <Button variant="primary" onClick={handleDownload} disabled={isDownloading}>
              {isDownloading ? 'Downloading...' : '📥 Download File'}
            </Button>
          </section>
        )}

        {/* Written Manuscript Content */}
        {note.content && (
          <article className="note-details__content">
            <h3 className="note-details__content-title">Manuscript Content</h3>
            <div className="note-details__body">
              <pre className="note-details__text-view">{note.content}</pre>
            </div>
          </article>
        )}

        {/* Owner actions if viewing draft */}
        {isOwner && note.status === 'DRAFT' && (
          <div
            style={{
              marginTop: '32px',
              padding: '20px',
              backgroundColor: 'var(--color-bg-surface)',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div>
              <strong>This manuscript is saved as a private draft.</strong>
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-secondary)',
                  margin: '4px 0 0'
                }}
              >
                Only you can view this page until you submit it for review.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to={`/notes/${note.id}/edit`}>
                <Button variant="outline">Edit Draft</Button>
              </Link>
              <Button
                variant="primary"
                onClick={async () => {
                  await noteService.submitForReview(note.id);
                  navigate('/my-notes', {
                    state: {
                      notice: 'Manuscript submitted for moderation review.'
                    }
                  });
                }}
              >
                Submit for Review
              </Button>
            </div>
          </div>
        )}

        {/* Moderation Rejection Modal */}
        {rejectModalOpen && (
          <Modal
            isOpen={rejectModalOpen}
            onClose={() => setRejectModalOpen(false)}
            title="Request Manuscript Revision"
          >
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--color-text-secondary)',
                marginBottom: '16px'
              }}
            >
              Provide constructive academic feedback explaining why this manuscript cannot be
              approved in its current state. The student will see this feedback when revising.
            </p>

            <div className="note-form__group" style={{ marginBottom: '20px' }}>
              <label htmlFor="rejection-reason" className="note-form__label">
                Feedback for Scholar <span className="note-form__required">*</span>
              </label>
              <textarea
                id="rejection-reason"
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., The proofs in Section 2 are missing pseudocode examples. Please include the complete algorithm before resubmitting."
                className="note-form__textarea"
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button
                variant="outline"
                onClick={() => setRejectModalOpen(false)}
                disabled={isReviewing}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                disabled={isReviewing || !rejectionReason.trim()}
              >
                {isReviewing ? 'Submitting...' : 'Reject Manuscript'}
              </Button>
            </div>
          </Modal>
        )}
      </Container>
    </div>
  );
}

export default NoteDetailsPage;
