import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Skeleton from '../common/Skeleton.jsx';
import recommendationService from '../../services/recommendationService.js';
import noteService from '../../services/noteService.js';

/**
 * Curated faculty & curriculum recommendations for the student.
 */
export function DashboardRecommendations({
  recommendedNotes = [],
  loading = false,
  title,
  subtitle,
  onPreviewNote = null
}) {
  const [smartRecs, setSmartRecs] = useState([]);
  const [isSmartLoading, setIsSmartLoading] = useState(false);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadSmartRecommendations() {
      setIsSmartLoading(true);
      try {
        const data = await recommendationService.getPersonalizedRecommendations({ limit: 4 });
        if (isMounted && data?.recommendations?.length > 0) {
          setSmartRecs(data.recommendations);
        }
      } catch {
        // Fallback to overview recommendedNotes if API errors
      } finally {
        if (isMounted) {
          setIsSmartLoading(false);
        }
      }
    }

    loadSmartRecommendations();
    return () => {
      isMounted = false;
    };
  }, []);

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
    } catch (err) {
      console.error('Bookmark error:', err);
    }
  };

  const isLoading = loading || isSmartLoading;
  const displayItems =
    smartRecs.length > 0 ? smartRecs : recommendedNotes.map((n) => ({ note: n }));

  return (
    <section style={{ marginBottom: '28px' }} aria-labelledby="recommendations-heading">
      <div className="dash-section-header">
        <div>
          <h2 id="recommendations-heading" className="dash-section-header__title">
            {title || 'Recommended for You'}
          </h2>
          <p className="dash-section-header__sub">
            {subtitle || 'Hand-picked manuscripts aligned to your enrolled curriculum and active semester'}
          </p>
        </div>
        <Link to="/notes/recommended" className="dash-section-header__link">
          Explore All Recommendations →
        </Link>
      </div>

      {isLoading ? (
        <div className="dash-notes-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="dash-note-card">
              <Skeleton width="100px" height="18px" />
              <div style={{ marginTop: '10px' }}>
                <Skeleton width="100%" height="20px" />
                <Skeleton width="70%" height="20px" />
              </div>
              <div style={{ marginTop: '14px' }}>
                <Skeleton width="100%" height="32px" />
              </div>
            </div>
          ))}
        </div>
      ) : displayItems.length === 0 ? (
        <div className="dash-empty-box" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '30px' }}>⭐</span>
          <h3 className="dash-empty-title">Recommendations In Progress</h3>
          <p className="dash-empty-desc">
            As faculty publish notes for your course and semester, personalized recommendations will appear here.
          </p>
          <Link to="/notes/explore" className="btn btn--primary btn--sm" style={{ marginTop: '8px' }}>
            Browse Full Catalog
          </Link>
        </div>
      ) : (
        <div className="dash-notes-grid">
          {displayItems.slice(0, 3).map((item, idx) => {
            const note = item.note || item;
            const isSaved = bookmarkedIds.has(note.id);

            return (
              <article key={note.id || idx} className="dash-note-card">
                <div className="dash-note-card__top">
                  <div className="dash-note-card__tags">
                    <span className="dash-note-card__tag dash-note-card__tag--subject">
                      ⭐ Recommended
                    </span>
                    {note.subject?.name && (
                      <span className="dash-note-card__tag">
                        {note.subject.name}
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
                  {note.description || 'Highly rated curriculum manuscript for course revision and exam preparation.'}
                </p>

                <div className="dash-note-card__meta-row">
                  <span>👁️ {note.viewCount || 0} reads</span>
                  <span style={{ color: '#0f766e', fontWeight: 700 }}>
                    📥 {note.downloadCount || 0} downloads
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

export default DashboardRecommendations;
