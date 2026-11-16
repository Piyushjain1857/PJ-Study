import React from 'react';
import Skeleton from '../common/Skeleton.jsx';

/**
 * Campus Announcements for Student Dashboard 3.0.
 * Displays critical updates and academic notices published by Super Admin.
 */
export function DashboardAnnouncements({
  announcements = [],
  loading = false,
  title
}) {
  return (
    <div className="dash-announcements-box">
      <div className="dash-section-header" style={{ marginBottom: '12px' }}>
        <div>
          <h3 className="dash-section-header__title">
            {title || 'Campus Announcements'}
          </h3>
          <p className="dash-section-header__sub">
            Verified updates from K.R. Mangalam University & Platform Administration
          </p>
        </div>
        <span style={{ fontSize: '16px' }}>📢</span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Skeleton height="60px" count={2} />
        </div>
      ) : announcements.length === 0 ? (
        <div style={{ padding: '24px 12px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
          <span style={{ fontSize: '26px' }}>🎉</span>
          <p style={{ margin: '6px 0 2px', fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
            You're all caught up!
          </p>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            No new campus announcements at this time.
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {announcements.map((ann) => {
            const dateStr = new Date(ann.publishedAt || ann.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            });

            const isHighPriority = ann.priority === 'HIGH' || ann.priority === 'URGENT';
            const tagClass = isHighPriority
              ? 'dash-announcement-tag--exam'
              : ann.priority === 'CAMPUS'
                ? 'dash-announcement-tag--campus'
                : 'dash-announcement-tag--normal';

            return (
              <div key={ann.id} className="dash-announcement-item">
                <div className="dash-announcement-top">
                  <span className={`dash-announcement-tag ${tagClass}`}>
                    {ann.priority || 'NOTICE'}
                  </span>
                  <span className="dash-announcement-date">{dateStr}</span>
                </div>
                <h4 className="dash-announcement-title">{ann.title}</h4>
                <p className="dash-announcement-msg">{ann.message}</p>
                {ann.targetUrl && (
                  <a
                    href={ann.targetUrl}
                    style={{ fontSize: '11px', color: '#0f766e', fontWeight: 700, marginTop: '6px', display: 'inline-block' }}
                  >
                    Learn More →
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DashboardAnnouncements;
