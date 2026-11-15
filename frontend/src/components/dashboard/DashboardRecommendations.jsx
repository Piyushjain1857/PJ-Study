import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Skeleton from '../common/Skeleton.jsx';
import recommendationService from '../../services/recommendationService.js';
import RecommendationReason from '../recommendations/RecommendationReason.jsx';

/**
 * Top recommended peer notes based on personal curriculum signals and popularity.
 *
 * @param {{
 *   recommendedNotes?: Array<any>,
 *   loading?: boolean
 * }} props
 */
export function DashboardRecommendations({ recommendedNotes = [], loading = false }) {
  const [smartRecs, setSmartRecs] = useState([]);
  const [isSmartLoading, setIsSmartLoading] = useState(false);

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

  const isLoading = loading || isSmartLoading;
  const displayItems =
    smartRecs.length > 0 ? smartRecs : recommendedNotes.map((n) => ({ note: n }));

  return (
    <div className="dash-section-card">
      <div className="dash-section-header">
        <div>
          <h3 className="dash-section-title">Recommended for You</h3>
          <p
            style={{
              margin: '2px 0 0',
              fontSize: '0.75rem',
              color: 'var(--color-text-secondary, #74756f)'
            }}
          >
            Curated from your active courses and study signals
          </p>
        </div>
        <Link
          to="/notes/recommended"
          style={{
            fontSize: '0.78rem',
            color: 'var(--color-primary, #285943)',
            fontWeight: 600,
            textDecoration: 'none'
          }}
        >
          View All →
        </Link>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Skeleton height={52} count={3} />
        </div>
      ) : displayItems.length === 0 ? (
        <div className="dash-empty-box" style={{ padding: '20px 8px' }}>
          <p style={{ fontSize: '0.8rem' }}>Check back soon for curated peer recommendations.</p>
        </div>
      ) : (
        <div className="dash-resource-list">
          {displayItems.map((item, idx) => {
            const note = item.note || item;
            const reason = item.reason;
            const score = item.score;

            return (
              <Link
                key={note.id || `dash-rec-${idx}`}
                to={`/notes/${note.id}`}
                className="dash-resource-item"
                style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%'
                  }}
                >
                  {reason && <RecommendationReason reason={reason} score={score} />}
                  <span
                    style={{
                      color: 'var(--color-primary, #285943)',
                      fontWeight: 600,
                      fontSize: '0.85rem'
                    }}
                  >
                    →
                  </span>
                </div>

                <div className="dash-resource-info">
                  <span className="dash-resource-title">{note.title}</span>
                  <div className="dash-resource-meta">
                    {note.subject?.name && <span>{note.subject.name}</span>}
                    {note.semester && <span>• Sem {note.semester}</span>}
                    <span>• {note.downloadCount || 0} downloads</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DashboardRecommendations;
