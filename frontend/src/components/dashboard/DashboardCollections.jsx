import React from 'react';
import Badge from '../common/Badge.jsx';
import Skeleton from '../common/Skeleton.jsx';

/**
 * Collections preview card for the student dashboard.
 *
 * @param {{
 *   collections: Array<any>,
 *   loading?: boolean
 * }} props
 */
export function DashboardCollections({ collections = [], loading = false }) {
  return (
    <div className="dash-section-card">
      <div className="dash-section-header">
        <h3 className="dash-section-title">My Collections</h3>
        <Badge variant="accent" label={`${collections.length} Binders`} size="sm" />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Skeleton height={50} count={2} />
        </div>
      ) : collections.length === 0 ? (
        <div className="dash-empty-box" style={{ padding: '20px 8px' }}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            width="32"
            height="32"
          >
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
          <p style={{ fontSize: '0.8rem' }}>
            No custom study collections yet. Group notes into syllabus binders for efficient exam
            preparation.
          </p>
        </div>
      ) : (
        <div className="dash-collection-list">
          {collections.map((col) => (
            <div key={col.id} className="dash-collection-item">
              <div>
                <div className="dash-collection-title">{col.name}</div>
                {col.description && <div className="dash-collection-desc">{col.description}</div>}
              </div>
              <Badge variant="neutral" label={`${col.noteCount} notes`} size="sm" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DashboardCollections;
