import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import noteService from '../../services/noteService.js';
import Skeleton from '../common/Skeleton.jsx';

/**
 * Format bytes to readable size
 */
function formatBytes(bytes) {
  if (!bytes) return '';
  const num = Number(bytes);
  if (isNaN(num) || num <= 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(num) / Math.log(k));
  return `${parseFloat((num / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Section displaying the latest curriculum manuscripts published to PJ Study.
 */
export function DashboardRecentPublishedNotes({
  notes = [],
  loading = false,
  title,
  subtitle,
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
    <section style={{ marginBottom: '28px' }} aria-labelledby="recent-notes-heading">
      <div className="dash-section-header">
        <div>
          <h2 id="recent-notes-heading" className="dash-section-header__title">
            {title || 'Recently Added Notes'}
          </h2>
          <p className="dash-section-header__sub">
            {subtitle || 'Latest curriculum manuscripts uploaded and published to the catalog'}
          </p>
        </div>
        <Link to="/notes/explore" className="dash-section-header__link">
          View All Notes →
        </Link>
      </div>

      {loading ? (
        <div className="dash-notes-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="dash-note-card">
              <Skeleton width="120px" height="18px" />
              <div style={{ marginTop: '12px' }}>
                <Skeleton width="100%" height="22px" />
                <Skeleton width="80%" height="22px" />
              </div>
              <div style={{ marginTop: '14px' }}>
                <Skeleton width="100%" height="32px" />
              </div>
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="dash-empty-box" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '32px' }}>📖</span>
          <h3 className="dash-empty-title">No Notes Published Yet</h3>
          <p className="dash-empty-desc">
            Check back soon as faculty upload exam solutions and curriculum guides.
          </p>
          <Link to="/notes/explore" className="btn btn--primary btn--sm" style={{ marginTop: '8px' }}>
            Explore All Catalog Notes
          </Link>
        </div>
      ) : (
        <div className="dash-notes-grid">
          {notes.map((note) => {
            const ext = note.fileName ? note.fileName.split('.').pop()?.toUpperCase() : 'PDF';
            const sizeStr = formatBytes(note.fileSize);
            const uploadDate = new Date(note.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });
            const isSaved = bookmarkedIds.has(note.id);

            return (
              <article key={note.id} className="dash-note-card">
                <div className="dash-note-card__top">
                  <div className="dash-note-card__tags">
                    {note.subject?.name && (
                      <span className="dash-note-card__tag dash-note-card__tag--subject">
                        {note.subject.code ? `${note.subject.code} · ` : ''}{note.subject.name}
                      </span>
                    )}
                    {note.course?.name && (
                      <span className="dash-note-card__tag">
                        {note.course.name}
                      </span>
                    )}
                    {note.semester && (
                      <span className="dash-note-card__tag">
                        Sem {note.semester}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    className={`dash-note-card__bookmark-btn ${isSaved ? 'dash-note-card__bookmark-btn--active' : ''}`}
                    onClick={(e) => handleToggleBookmark(e, note.id)}
                    title={isSaved ? 'Remove bookmark' : 'Bookmark this note'}
                    aria-label={isSaved ? 'Remove bookmark' : 'Bookmark this note'}
                  >
                    {isSaved ? '🔖' : '🤍'}
                  </button>
                </div>

                <Link to={`/notes/${note.id}`} className="dash-note-card__title">
                  {note.title}
                </Link>

                <p className="dash-note-card__desc">
                  {note.description || 'Curriculum manuscript published for student exam preparation and study.'}
                </p>

                <div className="dash-note-card__meta-row">
                  <span>📅 {uploadDate}</span>
                  <span style={{ fontWeight: 700, color: '#0f766e' }}>
                    {ext} {sizeStr && `• ${sizeStr}`}
                  </span>
                </div>

                <div className="dash-note-card__actions">
                  <button
                    type="button"
                    className="dash-note-card__btn dash-note-card__btn--preview"
                    onClick={() => {
                      if (onPreviewNote) {
                        onPreviewNote(note);
                      } else {
                        window.location.href = `/notes/${note.id}`;
                      }
                    }}
                  >
                    👁️ Preview
                  </button>
                  <button
                    type="button"
                    className="dash-note-card__btn dash-note-card__btn--download"
                    onClick={(e) => handleDownload(e, note)}
                    disabled={downloadingId === note.id}
                  >
                    {downloadingId === note.id ? 'Saving...' : '📥 Download'}
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

export default DashboardRecentPublishedNotes;
