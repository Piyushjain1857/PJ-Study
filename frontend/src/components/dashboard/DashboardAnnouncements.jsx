import React from 'react';
import Skeleton from '../common/Skeleton.jsx';

/**
 * Editorial Campus Announcements (Section H).
 * Displays genuine, administrator-published academic notices.
 * Never generates fabricated or placeholder university notices.
 */
export const DashboardAnnouncements = React.memo(function DashboardAnnouncements({
  announcements = [],
  loading = false
}) {
  if (loading) {
    return (
      <section className="dash-section" aria-label="Campus Notices">
        <Skeleton height="56px" rounded="md" />
      </section>
    );
  }

  // Gracefully omit if no genuine announcements exist in the database
  if (!announcements || announcements.length === 0) {
    return null;
  }

  return (
    <section className="dash-section" aria-labelledby="campus-announcements-heading">
      <div className="dash-announcements-compact-wrap">
        <div className="dash-announcements-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span id="campus-announcements-heading">Campus Notice</span>
        </div>

        <div className="dash-announcements-items">
          {announcements.map((ann) => {
            const dateStr = ann.publishedAt
              ? new Date(ann.publishedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })
              : '';

            return (
              <div key={ann.id} className="dash-announcement-inline">
                <span className="dash-announcement-inline__title">
                  {ann.title}:
                </span>
                <span className="dash-announcement-inline__msg">
                  {ann.message}
                </span>
                {ann.targetUrl && (
                  <a
                    href={ann.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dash-announcement-inline__link"
                  >
                    View Notice →
                  </a>
                )}
                {dateStr && (
                  <span className="dash-announcement-inline__date">
                    ({dateStr})
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
});

export default DashboardAnnouncements;
