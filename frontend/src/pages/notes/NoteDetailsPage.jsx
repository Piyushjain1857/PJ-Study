import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import noteService from '../../services/noteService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Avatar from '../../components/common/Avatar.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import NoteStatusBadge from '../../components/notes/NoteStatusBadge.jsx';
import Container from '../../components/layout/Container.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import NotePreview from '../../components/notes/NotePreview.jsx';
import SimilarNotesSection from '../../components/recommendations/SimilarNotesSection.jsx';
import NoteReviewsSection from '../../components/reviews/NoteReviewsSection.jsx';
import SEO from '../../components/common/SEO.jsx';
import { formatBytes, getFileFormatInfo } from '../../utils/fileUtils.js';
import './NoteDetailsPage.css';
import '../../styles/notes-discovery.css';
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
  const [showPreview, setShowPreview] = useState(true);

  // Bookmark & Share interaction states
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isBookmarkLoading, setIsBookmarkLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const loadNote = useCallback(async () => {
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
  }, [id]);

  useEffect(() => {
    loadNote();
  }, [loadNote]);

  // Check initial bookmark status for authenticated scholars
  useEffect(() => {
    if (user && id) {
      noteService
        .getBookmarkedNotes({ limit: 100 })
        .then((res) => {
          const items = res.items || (Array.isArray(res) ? res : []);
          const isSaved = items.some(
            (b) => b.noteId === id || b.id === id || b.note?.id === id
          );
          setIsBookmarked(isSaved);
        })
        .catch(() => {});
    }
  }, [user, id]);

  const canModerate =
    (isModerator || isAdmin || isSuperAdmin) &&
    (note?.status === 'PENDING' || note?.status === 'PENDING_REVIEW') &&
    note?.uploadedById !== user?.id;

  const isOwner = user && note?.uploadedById === user.id;
  const canEdit = user && (isOwner || isModerator || isAdmin || isSuperAdmin);

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
      setNote((prev) => (prev ? { ...prev, downloadCount: (prev.downloadCount || 0) + 1 } : prev));
    } catch (err) {
      setError(
        err.response?.data?.error?.message || err.message || 'Failed to download study document.'
      );
    } finally {
      setIsDownloading(false);
    }
  }

  // Toggle Bookmark handler
  async function handleToggleBookmark() {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setIsBookmarkLoading(true);
    try {
      if (isBookmarked) {
        await noteService.removeBookmark(id);
        setIsBookmarked(false);
        setActionNotice('Note removed from your saved library.');
      } else {
        await noteService.bookmarkNote(id);
        setIsBookmarked(true);
        setActionNotice('Note saved to your personal library.');
      }
      setTimeout(() => setActionNotice(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to update bookmark.');
    } finally {
      setIsBookmarkLoading(false);
    }
  }

  // Share note link handler
  function handleShareLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  if (isLoading) {
    return (
      <div className="notes-page note-details-page">
        <SEO title="Loading Study Note..." noindex={true} />
        <Container size="md">
          <Skeleton width="160px" height="32px" style={{ marginBottom: '24px' }} />
          <Skeleton width="100%" height="240px" style={{ borderRadius: '12px', marginBottom: '24px' }} />
          <Skeleton count={5} height="24px" style={{ marginBottom: '14px' }} />
        </Container>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="notes-page note-details-page">
        <SEO title="Study Note Not Found" noindex={true} />
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

  const isApproved = ['PUBLISHED', 'APPROVED'].includes(note.status);
  const noteSchema = isApproved
    ? {
        '@context': 'https://schema.org',
        '@type': 'LearningResource',
        name: note.title,
        description:
          note.description || `${note.title} study notes for ${note.subject?.name || 'course'}.`,
        learningResourceType: 'Study Material',
        educationalLevel: note.course?.degreeLevel || 'Higher Education',
        about: {
          '@type': 'Thing',
          name: note.subject?.name || 'Academic Curriculum'
        },
        author: {
          '@type': 'Person',
          name: note.uploadedBy?.name || 'Academic Scholar'
        },
        datePublished: note.publishedAt || note.createdAt
      }
    : null;

  const displayDate = new Date(note.publishedAt || note.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const formatInfo = getFileFormatInfo(note.fileName, note.mimeType);
  const formattedSize = formatBytes(note.fileSize);

  return (
    <div className="notes-page note-details-page">
      <SEO
        title={`${note.title}${note.course?.name ? ` | ${note.course.name}` : ''}`}
        description={
          note.description ||
          `Study manuscript for ${note.subject?.name || 'academic curriculum'} on PJ Study.`
        }
        canonical={`/notes/${note.id}`}
        type="article"
        noindex={!isApproved}
        schema={noteSchema}
      />
      <Container size="md">
        {/* Top Navigation & Action Bar */}
        <div className="note-details__top-bar">
          <nav className="note-details__breadcrumb" aria-label="Breadcrumb">
            <button
              type="button"
              className="note-details__back-btn"
              onClick={() => navigate(-1)}
              title="Return to previous page"
            >
              ← Back
            </button>
            <span className="note-details__crumb-sep">/</span>
            <Link to="/notes/explore" className="note-details__crumb-link">
              Explore Notes
            </Link>
            {note.course && (
              <>
                <span className="note-details__crumb-sep">/</span>
                <span className="note-details__crumb-link">{note.course.name}</span>
              </>
            )}
            {note.semester && (
              <>
                <span className="note-details__crumb-sep">/</span>
                <span>Sem {note.semester}</span>
              </>
            )}
            {note.subject && (
              <>
                <span className="note-details__crumb-sep">/</span>
                <span className="note-details__crumb-curr">{note.subject.name}</span>
              </>
            )}
          </nav>

          <div className="note-details__top-actions">
            <button
              type="button"
              className={`note-details__pill-btn ${
                isBookmarked ? 'note-details__pill-btn--active' : ''
              }`}
              onClick={handleToggleBookmark}
              disabled={isBookmarkLoading}
              title={isBookmarked ? 'Remove from saved library' : 'Save note to library'}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark note'}
            >
              <span>{isBookmarked ? '★ Saved' : '☆ Save'}</span>
            </button>

            <button
              type="button"
              className="note-details__pill-btn"
              onClick={handleShareLink}
              title="Copy shareable note link"
              aria-label="Share note"
            >
              <span>{copiedLink ? '✓ Copied' : '🔗 Share'}</span>
            </button>

            {canEdit && (
              <Link to={`/notes/${note.id}/edit`}>
                <button
                  type="button"
                  className="note-details__pill-btn note-details__pill-btn--edit"
                  title="Edit manuscript metadata"
                >
                  <span>✏️ Edit</span>
                </button>
              </Link>
            )}
          </div>
        </div>

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

        {/* Manuscript Header Card */}
        <header className="note-details__header">
          <div className="note-details__badges">
            {note.category && (
              <span className="note-details__category-pill">{note.category.name}</span>
            )}
            {note.course && (
              <span className="note-details__course-pill">{note.course.name}</span>
            )}
            {note.semester && (
              <span className="note-details__course-pill">Semester {note.semester}</span>
            )}
            {note.subject?.credits && (
              <span className="note-details__credits-pill">
                {note.subject.credits} Academic Credits
              </span>
            )}
            <NoteStatusBadge status={note.status} />
          </div>

          <h1 className="note-details__title">{note.title}</h1>

          {note.description && (
            <p className="note-details__abstract">{note.description}</p>
          )}

          {/* Author and Metadata Bar */}
          <div className="note-details__meta-bar">
            <div className="note-details__author">
              <div className="note-details__author-avatar-wrap">
                <Avatar
                  name={note.uploadedBy?.name || 'Scholar'}
                  src={note.uploadedBy?.avatarUrl}
                  size="md"
                />
              </div>
              <div className="note-details__author-info">
                <div className="note-details__author-row">
                  <span className="note-details__author-name">
                    {note.uploadedBy?.name || 'Academic Scholar'}
                  </span>
                  {note.uploadedBy?.role && (
                    <span className="note-details__role-tag">
                      {note.uploadedBy.role === 'SUPER_ADMIN'
                        ? 'Super Admin'
                        : note.uploadedBy.role === 'ADMIN'
                        ? 'Faculty Reviewer'
                        : 'Scholar'}
                    </span>
                  )}
                </div>
                <span className="note-details__author-date">
                  {isApproved ? 'Published' : 'Uploaded'} on {displayDate}
                </span>
              </div>
            </div>

            <div className="note-details__counters">
              <span className="note-details__counter-pill">
                👁 {note.viewCount || 0} {note.viewCount === 1 ? 'view' : 'views'}
              </span>
              <span className="note-details__counter-pill">
                📥 {note.downloadCount || 0} {note.downloadCount === 1 ? 'download' : 'downloads'}
              </span>
              {note.averageRating > 0 && (
                <span className="note-details__counter-pill note-details__counter-pill--rating">
                  ★ {Number(note.averageRating).toFixed(1)} ({note.totalReviews || 0})
                </span>
              )}
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

        {/* Attached Document Section: Clean, Non-Duplicated Presentation */}
        {note.fileName && (
          <section className="note-details__document-section" aria-label="Attached Document">
            {!formatInfo.canPreviewInline ? (
              /* Case A: Non-inline format (DOCX, PPTX, XLSX, ZIP) -> Elegant File Hero Card */
              <div className="note-doc-hero">
                <div className="note-doc-hero__body">
                  <div className="note-doc-hero__left">
                    <div
                      className="note-doc-hero__badge"
                      style={{
                        color: formatInfo.color,
                        backgroundColor: formatInfo.bgColor,
                        borderColor: formatInfo.borderColor
                      }}
                    >
                      {formatInfo.badgeText}
                    </div>
                    <div className="note-doc-hero__details">
                      <div className="note-doc-hero__title-row">
                        <h3 className="note-doc-hero__file-name">{note.fileName}</h3>
                        <span className="note-doc-hero__status-tag">
                          <span className="note-doc-hero__status-dot" /> Verified Academic File
                        </span>
                      </div>
                      <p className="note-doc-hero__meta">
                        <strong>{formatInfo.friendlyType}</strong>
                        {formattedSize && <span>• {formattedSize}</span>}
                      </p>
                      <p className="note-doc-hero__app-hint">{formatInfo.appHint}.</p>
                    </div>
                  </div>

                  <div className="note-doc-hero__actions">
                    <button
                      type="button"
                      className="note-doc-hero__download-btn"
                      onClick={handleDownload}
                      disabled={isDownloading}
                    >
                      📥{' '}
                      {isDownloading
                        ? 'Downloading...'
                        : `Download Manuscript (${formattedSize || formatInfo.ext})`}
                    </button>
                  </div>
                </div>

                <div className="note-doc-hero__footer">
                  <div className="note-doc-hero__guarantee">
                    <span>🔒 Safe Academic Storage</span>
                    <span>•</span>
                    <span>Virus-scanned & preserved in high-fidelity original format</span>
                  </div>
                  <div>Direct institutional download for enrolled scholars</div>
                </div>
              </div>
            ) : (
              /* Case B: Interactive Inline Viewer (PDF, Image, Text) */
              <div className="note-doc-viewer-card">
                <div className="note-doc-viewer-toolbar">
                  <div className="note-doc-viewer-toolbar__left">
                    <span
                      className="note-doc-viewer-toolbar__badge"
                      style={{
                        color: formatInfo.color,
                        backgroundColor: formatInfo.bgColor,
                        borderColor: formatInfo.borderColor
                      }}
                    >
                      {formatInfo.badgeText}
                    </span>
                    <div className="note-doc-viewer-toolbar__info">
                      <h4 className="note-doc-viewer-toolbar__name">{note.fileName}</h4>
                      <p className="note-doc-viewer-toolbar__meta">
                        {formatInfo.friendlyType} {formattedSize && `• ${formattedSize}`}
                      </p>
                    </div>
                  </div>

                  <div className="note-doc-viewer-toolbar__actions">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview((prev) => !prev)}
                    >
                      {showPreview ? 'Hide Document Preview' : '👁 Open Document Preview'}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleDownload}
                      disabled={isDownloading}
                    >
                      📥 {isDownloading ? 'Downloading...' : 'Download'}
                    </Button>
                  </div>
                </div>

                {showPreview && (
                  <div className="note-doc-viewer-frame">
                    <NotePreview note={note} hideHeader={true} />
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* Written Manuscript Content (if note has inline markdown or text transcript) */}
        {note.content && (
          <article className="note-details__content">
            <h3 className="note-details__content-title">Manuscript Content</h3>
            <div className="note-details__body">
              <pre className="note-details__text-view">{note.content}</pre>
            </div>
          </article>
        )}

        {/* Owner actions if viewing draft or unpublished note */}
        {isOwner && ['DRAFT', 'UNPUBLISHED'].includes(note.status) && (
          <div
            style={{
              marginTop: '32px',
              padding: '20px 24px',
              backgroundColor: 'var(--color-bg-surface, #ffffff)',
              borderRadius: '12px',
              border: '1px solid var(--color-border, #d7d9d3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
            }}
          >
            <div>
              <strong style={{ color: 'var(--color-text-primary, #202620)' }}>
                This study note is currently unpublished.
              </strong>
              <p
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-secondary, #5c665c)',
                  margin: '4px 0 0'
                }}
              >
                Only administrators and you can view this note until it is published.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link to={`/notes/${note.id}/edit`}>
                <Button variant="outline">Edit Note</Button>
              </Link>
              <Button
                variant="primary"
                onClick={async () => {
                  try {
                    await noteService.publishNote(note.id);
                    setActionNotice('Note published immediately to the academic catalog.');
                    loadNote();
                  } catch (err) {
                    setError(err.response?.data?.error?.message || 'Failed to publish note.');
                  }
                }}
              >
                Publish Immediately
              </Button>
            </div>
          </div>
        )}

        {/* Smart Similar Notes Recommendations */}
        {isApproved && <SimilarNotesSection noteId={note.id} />}

        {/* Notes Ratings, Reviews & Quality Feedback */}
        {note && (
          <NoteReviewsSection
            noteId={note.id}
            noteTitle={note.title}
            isOwner={isOwner}
            isApproved={isApproved}
          />
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
                color: 'var(--color-text-secondary, #5c665c)',
                marginBottom: '16px'
              }}
            >
              Provide constructive academic feedback explaining why this manuscript cannot be
              approved in its current form.
            </p>
            <textarea
              className="note-form__textarea"
              rows={4}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Please clarify Unit 2 diagrams or provide missing citations..."
              style={{ width: '100%', marginBottom: '20px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="outline" onClick={() => setRejectModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleReject}
                disabled={isReviewing || !rejectionReason.trim()}
              >
                {isReviewing ? 'Submitting...' : 'Confirm Rejection'}
              </Button>
            </div>
          </Modal>
        )}
      </Container>
    </div>
  );
}

export default NoteDetailsPage;
