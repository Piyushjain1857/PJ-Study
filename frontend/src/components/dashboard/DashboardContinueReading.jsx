import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import noteService from '../../services/noteService.js';
import Skeleton from '../common/Skeleton.jsx';

/**
 * Format relative timestamp for last accessed notes
 */
function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Get visual format metadata for document types
 */
function getFormatBadge(mimeType, fileName) {
  const safeName = typeof fileName === 'string' ? fileName.trim() : '';
  const safeMime = typeof mimeType === 'string' ? mimeType.trim().toLowerCase() : '';
  const ext = safeName.includes('.') ? safeName.split('.').pop()?.toUpperCase() : '';
  if (safeMime.includes('pdf') || ext === 'PDF') {
    return { label: 'PDF', variant: 'pdf' };
  }
  if (safeMime.includes('image') || ['PNG', 'JPG', 'JPEG', 'WEBP'].includes(ext)) {
    return { label: ext || 'IMG', variant: 'image' };
  }
  if (safeMime.includes('text') || ['TXT', 'MD'].includes(ext)) {
    return { label: ext || 'TXT', variant: 'text' };
  }
  return { label: ext || 'DOC', variant: 'doc' };
}

/**
 * Continue Reading Section (Section C).
 * Highlights the student's recently accessed manuscripts with last viewed time and 1-click resume.
 */
export function DashboardContinueReading({
  views = [],
  loading = false,
  onPreviewNote = null
}) {
  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownload = async (e, note) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setDownloadingId(note.id);
      await noteService.downloadFile(note.id, note.fileName || `${note.slug || 'manuscript'}.pdf`);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <section className="dash-section" aria-labelledby="continue-reading-heading">
      <div className="dash-section-header">
        <div>
          <h2 id="continue-reading-heading" className="dash-section-title">
            Continue Reading
          </h2>
          <p className="dash-section-subtitle">
            Resume your recently accessed lecture guides and revision notes
          </p>
        </div>
        <Link to="/my-notes?tab=downloads" className="dash-section-link">
          Reading History →
        </Link>
      </div>

      {loading ? (
        <div className="dash-cards-grid dash-cards-grid--compact">
          {[1, 2, 3].map((i) => (
            <div key={i} className="dash-resource-card">
              <Skeleton width="60px" height="20px" rounded="sm" />
              <div style={{ marginTop: '12px' }}>
                <Skeleton width="100%" height="20px" />
                <Skeleton width="60%" height="16px" style={{ marginTop: '6px' }} />
              </div>
              <div style={{ marginTop: '16px' }}>
                <Skeleton width="100%" height="32px" rounded="sm" />
              </div>
            </div>
          ))}
        </div>
      ) : views.length === 0 ? (
        <div className="dash-empty-state">
          <div className="dash-empty-icon-wrap" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
              <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
            </svg>
          </div>
          <h3 className="dash-empty-title">No Recent Activity</h3>
          <p className="dash-empty-desc">
            As you study and review manuscripts, they will automatically appear here for immediate access.
          </p>
          <Link to="/notes/explore" className="dash-empty-action">
            Explore Study Catalog →
          </Link>
        </div>
      ) : (
        <div className="dash-cards-grid dash-cards-grid--compact">
          {views.slice(0, 3).map((v) => {
            const note = v.note || v;
            const format = getFormatBadge(note.mimeType, note.fileName);
            const timeAgo = formatRelativeTime(v.viewedAt);

            return (
              <article key={v.id || note.id} className="dash-resource-card dash-resource-card--resume">
                <div className="dash-card-header">
                  <span className={`dash-file-badge dash-file-badge--${format.variant}`}>
                    {format.label}
                  </span>
                  {timeAgo && (
                    <span className="dash-card-time-ago">
                      Viewed {timeAgo}
                    </span>
                  )}
                </div>

                <div className="dash-card-body">
                  <Link
                    to={`/notes/${note.id}`}
                    className="dash-card-title"
                    title={note.title}
                  >
                    {note.title}
                  </Link>

                  <div className="dash-card-academic-meta">
                    {note.subject?.name && (
                      <span className="dash-meta-tag">
                        {note.subject.name}
                      </span>
                    )}
                    {note.semester && (
                      <span className="dash-meta-tag">
                        Sem {note.semester}
                      </span>
                    )}
                  </div>
                </div>

                <div className="dash-card-actions">
                  <button
                    type="button"
                    className="dash-btn dash-btn--primary dash-btn--sm"
                    onClick={() => {
                      if (onPreviewNote) {
                        onPreviewNote(note);
                      } else {
                        window.location.href = `/notes/${note.id}`;
                      }
                    }}
                    title="Resume reading manuscript"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                    <span>Resume</span>
                  </button>

                  <button
                    type="button"
                    className="dash-btn dash-btn--outline dash-btn--sm"
                    onClick={(e) => handleDownload(e, note)}
                    disabled={downloadingId === note.id}
                    title="Download file directly"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span>{downloadingId === note.id ? 'Saving...' : 'Download'}</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default DashboardContinueReading;
