import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button.jsx';
import Badge from '../common/Badge.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import Skeleton from '../common/Skeleton.jsx';

/**
 * Switchable panel for student's recently saved and uploaded study notes.
 *
 * @param {{
 *   recentBookmarks: Array<any>,
 *   recentUploads: Array<any>,
 *   loading?: boolean
 * }} props
 */
export function DashboardRecentNotes({
  recentBookmarks = [],
  recentUploads = [],
  loading = false
}) {
  const [activeTab, setActiveTab] = useState('saved');

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(new Date(dateStr));
  };

  return (
    <div className="dash-section-card">
      <div className="dash-section-header">
        <div className="dash-tabs" role="tablist">
          <button
            type="button"
            className={`dash-tab-btn ${activeTab === 'saved' ? 'dash-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('saved')}
            role="tab"
            aria-selected={activeTab === 'saved'}
          >
            Saved Notes ({recentBookmarks.length})
          </button>
          <button
            type="button"
            className={`dash-tab-btn ${activeTab === 'uploads' ? 'dash-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('uploads')}
            role="tab"
            aria-selected={activeTab === 'uploads'}
          >
            My Uploads ({recentUploads.length})
          </button>
        </div>

        <Link to={activeTab === 'saved' ? '/notes/explore' : '/my-notes'}>
          <Button variant="ghost" size="sm">
            View All →
          </Button>
        </Link>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Skeleton height={56} count={3} />
        </div>
      ) : activeTab === 'saved' ? (
        recentBookmarks.length === 0 ? (
          <div className="dash-empty-box">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              width="36"
              height="36"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
            <p>
              You haven&apos;t bookmarked any notes yet. Browse the academic catalog to save lecture
              notes for quick access.
            </p>
            <Link to="/notes/explore">
              <Button variant="outline" size="sm">
                Explore Notes
              </Button>
            </Link>
          </div>
        ) : (
          <div className="dash-resource-list">
            {recentBookmarks.map((item) => {
              const note = item.note || {};
              return (
                <Link key={item.id} to={`/notes/${note.id}`} className="dash-resource-item">
                  <div className="dash-resource-info">
                    <span className="dash-resource-title">{note.title}</span>
                    <div className="dash-resource-meta">
                      {note.subject?.name && <span>{note.subject.name}</span>}
                      {note.course?.name && (
                        <>
                          <span>•</span>
                          <span>{note.course.name}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>Saved {formatDate(item.bookmarkedAt)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {note.category?.name && (
                      <Badge variant="neutral" label={note.category.name} size="sm" />
                    )}
                    <span style={{ color: 'var(--color-primary, #285943)', fontWeight: 600 }}>
                      →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      ) : recentUploads.length === 0 ? (
        <div className="dash-empty-box">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            width="36"
            height="36"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
          </svg>
          <p>
            You haven&apos;t uploaded any study materials yet. Share your high-quality lecture notes
            or solutions with fellow students.
          </p>
          <Link to="/notes/new">
            <Button variant="primary" size="sm">
              + Upload Study Note
            </Button>
          </Link>
        </div>
      ) : (
        <div className="dash-resource-list">
          {recentUploads.map((note) => (
            <Link key={note.id} to={`/notes/${note.id}`} className="dash-resource-item">
              <div className="dash-resource-info">
                <span className="dash-resource-title">{note.title}</span>
                <div className="dash-resource-meta">
                  {note.subject?.name && <span>{note.subject.name}</span>}
                  <span>•</span>
                  <span>{note.downloadCount || 0} downloads</span>
                  <span>•</span>
                  <span>{note.viewCount || 0} views</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <StatusBadge status={note.status} />
                <span style={{ color: 'var(--color-primary, #285943)', fontWeight: 600 }}>→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default DashboardRecentNotes;
