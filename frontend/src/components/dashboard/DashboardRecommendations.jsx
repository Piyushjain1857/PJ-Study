import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import noteService from '../../services/noteService.js';
import Skeleton from '../common/Skeleton.jsx';

function getFormatBadge(mimeType, fileName) {
  const ext = fileName ? fileName.split('.').pop()?.toUpperCase() : '';
  if (mimeType?.includes('pdf') || ext === 'PDF') {
    return { label: 'PDF', variant: 'pdf' };
  }
  if (mimeType?.includes('image') || ['PNG', 'JPG', 'JPEG', 'WEBP'].includes(ext)) {
    return { label: ext || 'IMG', variant: 'image' };
  }
  if (mimeType?.includes('text') || ['TXT', 'MD'].includes(ext)) {
    return { label: ext || 'TXT', variant: 'text' };
  }
  return { label: ext || 'DOC', variant: 'doc' };
}

/**
 * Editorial Recommended Notes Component (Section E).
 * Highlights notes prioritizing the student's enrolled course, semester, and curriculum subjects.
 */
export function DashboardRecommendations({
  recommendedNotes = [],
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
    <section className="dash-section" aria-labelledby="curated-recs-heading">
      <div className="dash-section-header">
        <div>
          <h2 id="curated-recs-heading" className="dash-section-title">
            Recommended for You
          </h2>
          <p className="dash-section-subtitle">
            Curated manuscripts aligned to your enrolled curriculum and active semester
          </p>
        </div>
        <Link to="/notes/explore" className="dash-section-link">
          Explore All →
        </Link>
      </div>

      {loading ? (
        <div className="dash-cards-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="dash-resource-card">
              <Skeleton width="70px" height="20px" rounded="sm" />
              <div style={{ marginTop: '12px' }}>
                <Skeleton width="100%" height="22px" />
                <Skeleton width="75%" height="16px" style={{ marginTop: '6px' }} />
              </div>
              <div style={{ marginTop: '16px' }}>
                <Skeleton width="100%" height="32px" rounded="sm" />
              </div>
            </div>
          ))}
        </div>
      ) : recommendedNotes.length === 0 ? (
        <div className="dash-empty-state">
          <div className="dash-empty-icon-wrap" aria-hidden="true">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <h3 className="dash-empty-title">Curriculum Recommendations Pending</h3>
          <p className="dash-empty-desc">
            As faculty approve study materials for your semester, personalized recommendations will appear here.
          </p>
          <Link to="/notes/explore" className="dash-empty-action">
            Browse All Published Notes →
          </Link>
        </div>
      ) : (
        <div className="dash-cards-grid">
          {recommendedNotes.map((item, idx) => {
            const note = item.note || item;
            const format = getFormatBadge(note.mimeType, note.fileName);
            const isSaved = bookmarkedIds.has(note.id);

            return (
              <article key={note.id || idx} className="dash-resource-card">
                <div className="dash-card-header">
                  <span className={`dash-file-badge dash-file-badge--${format.variant}`}>
                    {format.label}
                  </span>
                  <button
                    type="button"
                    className={`dash-card-bookmark-btn ${isSaved ? 'dash-card-bookmark-btn--saved' : ''}`}
                    onClick={(e) => handleToggleBookmark(e, note.id)}
                    title={isSaved ? 'Remove from bookmarks' : 'Save to bookmarks'}
                    aria-label={isSaved ? 'Remove bookmark' : 'Bookmark this note'}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
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
                      <span className="dash-meta-tag dash-meta-tag--subject">
                        {note.subject.name}
                      </span>
                    )}
                    {note.semester && (
                      <span className="dash-meta-tag">
                        Sem {note.semester}
                      </span>
                    )}
                    {note.course?.name && (
                      <span className="dash-meta-tag">
                        {note.course.name}
                      </span>
                    )}
                  </div>

                  {note.description && (
                    <p className="dash-card-desc">
                      {note.description}
                    </p>
                  )}
                </div>

                <div className="dash-card-footer">
                  <div className="dash-card-stats">
                    <span>{note.viewCount ?? 0} views</span>
                    <span>•</span>
                    <span>{note.downloadCount ?? 0} downloads</span>
                  </div>

                  <div className="dash-card-actions">
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
                      title="Quick preview document"
                    >
                      Preview
                    </button>

                    <button
                      type="button"
                      className="dash-btn dash-btn--primary dash-btn--sm"
                      onClick={(e) => handleDownload(e, note)}
                      disabled={downloadingId === note.id}
                      title="Download document file"
                    >
                      {downloadingId === note.id ? 'Saving...' : 'Download'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default DashboardRecommendations;
