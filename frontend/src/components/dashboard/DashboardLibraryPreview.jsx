import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Skeleton from '../common/Skeleton.jsx';

/**
 * Editorial Academic Library Shortcuts (Section G).
 * Provides fast access to the student's bookmarked notes, collection binders, and reading history.
 */
export function DashboardLibraryPreview({
  bookmarks = [],
  collections = [],
  stats = {},
  loading = false
}) {
  const navigate = useNavigate();

  const savedCount = stats.savedNotes ?? bookmarks.length;
  const collectionsCount = stats.collections ?? collections.length;
  const downloadsCount = stats.uniqueNotesDownloaded ?? stats.downloads ?? 0;

  return (
    <section className="dash-section" aria-labelledby="library-shortcuts-heading">
      <div className="dash-section-header">
        <div>
          <h2 id="library-shortcuts-heading" className="dash-section-title">
            Your Library
          </h2>
          <p className="dash-section-subtitle">
            Personal repository of saved study manuscripts, course binders, and downloads
          </p>
        </div>
        <Link to="/my-notes" className="dash-section-link">
          Open Full Library →
        </Link>
      </div>

      {/* 3 Editorial Quick Nav Cards */}
      <div className="dash-library-kpi-grid">
        <div
          className="dash-library-kpi-card"
          onClick={() => navigate('/my-notes?tab=bookmarks')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/my-notes?tab=bookmarks');
            }
          }}
          title="View bookmarked study notes"
        >
          <div className="dash-library-kpi-top">
            <span className="dash-library-kpi-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            <span className="dash-library-kpi-arrow">→</span>
          </div>
          <div className="dash-library-kpi-value">{loading ? '...' : savedCount}</div>
          <div className="dash-library-kpi-label">Bookmarked Notes</div>
          <div className="dash-library-kpi-sub">Saved for revision</div>
        </div>

        <div
          className="dash-library-kpi-card"
          onClick={() => navigate('/my-notes?tab=collections')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/my-notes?tab=collections');
            }
          }}
          title="View personal study collections"
        >
          <div className="dash-library-kpi-top">
            <span className="dash-library-kpi-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            <span className="dash-library-kpi-arrow">→</span>
          </div>
          <div className="dash-library-kpi-value">{loading ? '...' : collectionsCount}</div>
          <div className="dash-library-kpi-label">Course Binders</div>
          <div className="dash-library-kpi-sub">Curated collections</div>
        </div>

        <div
          className="dash-library-kpi-card"
          onClick={() => navigate('/my-notes?tab=downloads')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('/my-notes?tab=downloads');
            }
          }}
          title="View download history"
        >
          <div className="dash-library-kpi-top">
            <span className="dash-library-kpi-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </span>
            <span className="dash-library-kpi-arrow">→</span>
          </div>
          <div className="dash-library-kpi-value">{loading ? '...' : downloadsCount}</div>
          <div className="dash-library-kpi-label">Downloaded Files</div>
          <div className="dash-library-kpi-sub">Device study copies</div>
        </div>
      </div>

      {/* Recent Bookmarks and Binders Previews */}
      {loading ? (
        <div style={{ marginTop: '16px' }}>
          <Skeleton height="40px" count={2} />
        </div>
      ) : bookmarks.length > 0 && (
        <div className="dash-library-preview-list">
          <div className="dash-library-preview-list-header">
            <span>Recent Bookmarks</span>
            <Link to="/my-notes?tab=bookmarks">View All ({savedCount}) →</Link>
          </div>
          {bookmarks.slice(0, 3).map((b) => {
            const note = b.note || b;
            return (
              <Link
                key={b.id || note.id}
                to={`/notes/${note.id}`}
                className="dash-library-preview-item"
              >
                <div className="dash-library-preview-item__left">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true" style={{ color: 'var(--color-primary, #245C46)', flexShrink: 0 }}>
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                  <span className="dash-library-preview-item__title">{note.title}</span>
                </div>
                <div className="dash-library-preview-item__meta">
                  {note.subject?.name && <span>{note.subject.name}</span>}
                  {note.semester && <span>Sem {note.semester}</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default DashboardLibraryPreview;
