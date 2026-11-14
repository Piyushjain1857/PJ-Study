import React from 'react';
import Skeleton from '../common/Skeleton.jsx';

/**
 * Primary four metric summary cards for the student dashboard.
 *
 * @param {{
 *   stats: {
 *     savedNotes?: number,
 *     collections?: number,
 *     downloads?: number,
 *     uniqueNotesDownloaded?: number,
 *     uploads?: number
 *   },
 *   loading?: boolean
 * }} props
 */
export function DashboardStats({ stats = {}, loading = false }) {
  const cards = [
    {
      id: 'saved-notes',
      label: 'Saved Notes',
      value: stats.savedNotes ?? 0,
      subtext: 'Bookmarked in personal archive',
      iconClass: 'dash-stat-icon--primary',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          width="20"
          height="20"
        >
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      )
    },
    {
      id: 'my-collections',
      label: 'My Collections',
      value: stats.collections ?? 0,
      subtext: 'Organized course binders',
      iconClass: 'dash-stat-icon--accent',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          width="20"
          height="20"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      )
    },
    {
      id: 'downloads',
      label: 'Downloads',
      value: stats.downloads ?? 0,
      subtext: `${stats.uniqueNotesDownloaded ?? 0} unique documents`,
      iconClass: 'dash-stat-icon--verified',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          width="20"
          height="20"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      )
    },
    {
      id: 'my-uploads',
      label: 'My Uploads',
      value: stats.uploads ?? 0,
      subtext: 'Notes shared with students',
      iconClass: 'dash-stat-icon--purple',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          width="20"
          height="20"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="12" y2="12" />
          <line x1="15" y1="15" x2="12" y2="12" />
        </svg>
      )
    }
  ];

  return (
    <div className="dash-stats-grid" aria-label="Study Activity Statistics">
      {cards.map((card) => (
        <div key={card.id} className="dash-stat-card">
          <div className="dash-stat-header">
            <span className="dash-stat-label">{card.label}</span>
            <div className={`dash-stat-icon-wrap ${card.iconClass}`} aria-hidden="true">
              {card.icon}
            </div>
          </div>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Skeleton width="60%" height={36} />
              <Skeleton width="80%" height={14} />
            </div>
          ) : (
            <>
              <span className="dash-stat-value">{card.value.toLocaleString()}</span>
              <span className="dash-stat-subtext">{card.subtext}</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default DashboardStats;
