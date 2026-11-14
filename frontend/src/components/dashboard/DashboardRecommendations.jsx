import React from 'react';
import { Link } from 'react-router-dom';
import Badge from '../common/Badge.jsx';
import Skeleton from '../common/Skeleton.jsx';

/**
 * Top recommended peer notes based on community popularity and quality.
 *
 * @param {{
 *   recommendedNotes: Array<any>,
 *   loading?: boolean
 * }} props
 */
export function DashboardRecommendations({ recommendedNotes = [], loading = false }) {
  return (
    <div className="dash-section-card">
      <div className="dash-section-header">
        <h3 className="dash-section-title">Recommended for You</h3>
        <Badge variant="verified" label="Curated" size="sm" />
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Skeleton height={52} count={2} />
        </div>
      ) : recommendedNotes.length === 0 ? (
        <div className="dash-empty-box" style={{ padding: '20px 8px' }}>
          <p style={{ fontSize: '0.8rem' }}>Check back soon for curated peer recommendations.</p>
        </div>
      ) : (
        <div className="dash-resource-list">
          {recommendedNotes.map((note) => (
            <Link key={note.id} to={`/notes/${note.id}`} className="dash-resource-item">
              <div className="dash-resource-info">
                <span className="dash-resource-title">{note.title}</span>
                <div className="dash-resource-meta">
                  {note.subject?.name && <span>{note.subject.name}</span>}
                  <span>•</span>
                  <span>{note.downloadCount || 0} downloads</span>
                  {note.uploadedBy?.name && (
                    <>
                      <span>•</span>
                      <span>By {note.uploadedBy.name}</span>
                    </>
                  )}
                </div>
              </div>
              <span style={{ color: 'var(--color-primary, #285943)', fontWeight: 600 }}>→</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default DashboardRecommendations;
