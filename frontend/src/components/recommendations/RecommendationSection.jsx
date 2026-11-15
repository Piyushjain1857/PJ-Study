import React from 'react';
import RecommendationCard from './RecommendationCard.jsx';
import Skeleton from '../common/Skeleton.jsx';

/**
 * Editorial section wrapping a collection of recommendation cards.
 *
 * @param {{
 *   title: string,
 *   subtitle?: string,
 *   items: Array<any>,
 *   loading?: boolean,
 *   emptyMessage?: string
 * }} props
 */
export function RecommendationSection({
  title,
  subtitle,
  items = [],
  loading = false,
  emptyMessage = 'No recommendations available in this section yet.'
}) {
  return (
    <section className="rec-section">
      <div className="rec-section-header">
        <div className="rec-section-title-wrap">
          <h2 className="rec-section-title">{title}</h2>
          {subtitle && <p className="rec-section-subtitle">{subtitle}</p>}
        </div>
      </div>

      {loading ? (
        <div className="rec-grid">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              style={{
                backgroundColor: 'var(--color-surface, #ffffff)',
                border: '1px solid var(--color-border, #e6e3dc)',
                borderRadius: '8px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <Skeleton width="40%" height={24} />
              <Skeleton width="85%" height={20} />
              <Skeleton width="100%" height={40} />
              <Skeleton width="60%" height={16} />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div
          style={{
            backgroundColor: 'var(--color-surface-subtle, #f4f2ed)',
            border: '1px dashed var(--color-border, #e6e3dc)',
            borderRadius: '8px',
            padding: '24px',
            textAlign: 'center',
            color: 'var(--color-text-secondary, #74756f)',
            fontSize: '0.875rem'
          }}
        >
          <p style={{ margin: 0 }}>{emptyMessage}</p>
        </div>
      ) : (
        <div className="rec-grid">
          {items.map((item, index) => (
            <RecommendationCard key={item.note?.id || item.id || `rec-${index}`} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

export default RecommendationSection;
