import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import noteService from '../../services/noteService.js';
import Skeleton from '../common/Skeleton.jsx';

function formatBytes(bytes) {
  if (!bytes) return '';
  const num = Number(bytes);
  if (isNaN(num) || num <= 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(num) / Math.log(k));
  return `${parseFloat((num / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

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
 * Editorial Recently Published Notes Component (Section F).
 * Displays recently added academic manuscripts in a compact, highly functional row/card design.
 */
export const DashboardRecentPublishedNotes = React.memo(function DashboardRecentPublishedNotes({
  notes = [],
  loading = false,
  onPreviewNote = null,
  onBookmarkChanged = null
}) {
  const [downloadingId, setDownloadingId] = useState(null);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());

  const handleDownload = async (e, note) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setDownloadingId(note.id);
      await noteService.downloadFile(note.id, note.fileName || `${note.slug || 'study-note'}.pdf`);
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleToggleBookmark = async (e, noteId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const isBookmarked = bookmarkedIds.has(noteId);
      if (isBookmarked) {
        await noteService.removeBookmark(noteId);
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          next.delete(noteId);
          return next;
        });
      } else {
        await noteService.bookmarkNote(noteId);
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          next.add(noteId);
          return next;
        });
      }
      onBookmarkChanged?.();
    } catch (err) {
      console.error('Bookmark toggle error:', err);
    }
  };

  return (
    <section className="dash-section" aria-labelledby="recently-added-heading">
      <div className="dash-section-header">
        <div>
          <h2 id="recently-added-heading" className="dash-section-title">
            Recently Added
          </h2>
          <p className="dash-section-subtitle">
            Fresh academic manuscripts uploaded and published to the university catalog
          </p>
        </div>
        <Link to="/notes/explore?sort=newest" className="dash-section-link">
          Catalog New Releases →
        </Link>
      </div>

      {loading ? (
        <div className="dash-compact-list">
          {[1, 2, 3].map((i) => (
            <div key={i} className="dash-compact-row">
              <Skeleton width="48px" height="24px" rounded="sm" />
              <div style={{ flex: 1, marginLeft: '12px' }}>
                <Skeleton width="60%" height="18px" />
                <Skeleton width="40%" height="14px" style={{ marginTop: '4px' }} />
              </div>
              <Skeleton width="120px" height="30px" rounded="sm" />
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="dash-empty-state">
          <div className="dash-empty-icon-wrap" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <h3 className="dash-empty-title">No New Manuscripts</h3>
          <p className="dash-empty-desc">
            All newly published study notes will be chronologically listed here.
          </p>
          <Link to="/notes/explore" className="dash-empty-action">
            Search Catalog →
          </Link>
        </div>
      ) : (
        <div className="dash-compact-list">
          {notes.map((note) => {
            const format = getFormatBadge(note.mimeType, note.fileName);
            const sizeStr = formatBytes(note.fileSize);
            const dateStr = note.createdAt
              ? new Date(note.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })
              : '';
            const isSaved = bookmarkedIds.has(note.id);

            return (
              <article key={note.id} className="dash-compact-row">
                <div className="dash-compact-row__format">
                  <span className={`dash-file-badge dash-file-badge--${format.variant}`}>
                    {format.label}
                  </span>
                </div>

                <div className="dash-compact-row__content">
                  <div className="dash-compact-row__title-line">
                    <Link
                      to={`/notes/${note.id}`}
                      className="dash-compact-row__title"
                      title={note.title}
                    >
                      {note.title}
                    </Link>
                    {dateStr && (
                      <span className="dash-compact-row__date">
                        {dateStr}
                      </span>
                    )}
                  </div>

                  <div className="dash-compact-row__meta">
                    {note.subject?.name && (
                      <span className="dash-compact-row__meta-item">
                        {note.subject.name}
                      </span>
                    )}
                    {note.semester && (
                      <>
                        <span className="dash-compact-row__bullet">•</span>
                        <span className="dash-compact-row__meta-item">
                          Sem {note.semester}
                        </span>
                      </>
                    )}
                    {sizeStr && (
                      <>
                        <span className="dash-compact-row__bullet">•</span>
                        <span className="dash-compact-row__meta-item">
                          {sizeStr}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="dash-compact-row__actions">
                  <button
                    type="button"
                    className={`dash-icon-btn ${isSaved ? 'dash-icon-btn--saved' : ''}`}
                    onClick={(e) => handleToggleBookmark(e, note.id)}
                    title={isSaved ? 'Remove bookmark' : 'Bookmark note'}
                    aria-label={isSaved ? 'Remove bookmark' : 'Bookmark note'}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    className="dash-btn dash-btn--outline dash-btn--sm"
                    onClick={() => {
                      if (onPreviewNote) {
                        onPreviewNote(note);
                      } else {
                        window.location.href = `/notes/${note.id}`;
                      }
                    }}
                    title="Quick preview manuscript"
                  >
                    Preview
                  </button>

                  <button
                    type="button"
                    className="dash-btn dash-btn--primary dash-btn--sm"
                    onClick={(e) => handleDownload(e, note)}
                    disabled={downloadingId === note.id}
                    title="Download document"
                  >
                    {downloadingId === note.id ? '...' : 'Download'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
});

export default DashboardRecentPublishedNotes;
