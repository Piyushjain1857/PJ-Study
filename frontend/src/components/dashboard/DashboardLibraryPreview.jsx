import React from 'react';
import { Link } from 'react-router-dom';
import Skeleton from '../common/Skeleton.jsx';

/**
 * My Library Preview for Student Dashboard 3.0.
 * Shows bookmarked notes, collection binders, and quick actions to access personal library.
 */
export function DashboardLibraryPreview({
  bookmarks = [],
  collections = [],
  loading = false,
  title
}) {
  return (
    <div className="dash-library-box">
      <div className="dash-section-header" style={{ marginBottom: '12px' }}>
        <div>
          <h3 className="dash-section-header__title">
            {title || 'My Library Preview'}
          </h3>
          <p className="dash-section-header__sub">
            Your saved manuscripts & course revision binders
          </p>
        </div>
        <Link to="/my-notes" className="dash-section-header__link">
          Go to My Library →
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <Skeleton height="44px" count={3} />
        </div>
      ) : bookmarks.length === 0 && collections.length === 0 ? (
        <div style={{ padding: '24px 12px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
          <span style={{ fontSize: '26px' }}>🔖</span>
          <p style={{ margin: '6px 0 2px', fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
            No saved notes yet
          </p>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Click the bookmark icon on any note to save it to your library.
          </span>
          <div style={{ marginTop: '10px' }}>
            <Link to="/notes/explore" className="btn btn--outline btn--sm">
              Explore Notes
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Recent Saved Notes */}
          {bookmarks.slice(0, 3).map((b) => {
            const note = b.note || b;
            return (
              <Link
                key={b.id || note.id}
                to={`/notes/${note.id}`}
                className="dash-library-item"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                  <span style={{ fontSize: '16px' }}>🔖</span>
                  <div style={{ minWidth: 0 }}>
                    <div className="dash-library-item__title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {note.title}
                    </div>
                    <div className="dash-library-item__sub">
                      {note.subject?.name || 'Academic Subject'} · Sem {note.semester || 4}
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: '11px', color: '#0f766e', fontWeight: 700, flexShrink: 0, paddingLeft: '8px' }}>
                  Open →
                </span>
              </Link>
            );
          })}

          {/* Collections Binders */}
          {collections.length > 0 && (
            <div style={{ marginTop: '6px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '8px' }}>
                Course Collections:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {collections.slice(0, 4).map((c) => (
                  <Link
                    key={c.id}
                    to="/my-notes?tab=collections"
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#334155',
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span>📁</span>
                    <span>{c.name}</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>({c.noteCount ?? 0})</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DashboardLibraryPreview;
