import React from 'react';
import { Link } from 'react-router-dom';
import RecommendationReason from './RecommendationReason.jsx';
import Badge from '../common/Badge.jsx';
import Button from '../common/Button.jsx';

/**
 * Editorial card displaying an explainable note recommendation.
 *
 * @param {{
 *   item: {
 *     note: object,
 *     reason?: string,
 *     score?: number,
 *     reasons?: string[]
 *   }
 * }} props
 */
export function RecommendationCard({ item }) {
  const note = item?.note || item;
  const reason = item?.reason || 'Recommended Study Note';
  const score = item?.score;

  if (!note) return null;

  const {
    id,
    title,
    description,
    subject,
    course,
    category,
    semester,
    uploadedBy,
    downloadCount = 0,
    viewCount = 0
  } = note;

  return (
    <div className="rec-card">
      <div className="rec-card-top">
        <RecommendationReason reason={reason} score={score} />
        {category?.name && (
          <Badge variant="neutral" size="sm">
            {category.name}
          </Badge>
        )}
      </div>

      <div className="rec-card-body">
        <Link to={`/notes/${id}`} className="rec-card-title">
          {title}
        </Link>
        {description && <p className="rec-card-desc">{description}</p>}

        <div className="rec-card-academic-meta">
          {course?.name && <span className="rec-card-academic-tag">{course.name}</span>}
          {subject?.name && <span className="rec-card-academic-tag">{subject.name}</span>}
          {semester && <span className="rec-card-academic-tag">Sem {semester}</span>}
        </div>
      </div>

      <div>
        <div className="rec-card-bottom">
          <div className="rec-card-author">
            <span>By {uploadedBy?.name || 'Academic Scholar'}</span>
          </div>
          <div className="rec-card-stats">
            <span>{downloadCount} downloads</span>
            <span>•</span>
            <span>{viewCount} views</span>
          </div>
        </div>

        <div className="rec-card-actions">
          <Link to={`/notes/${id}`} style={{ textDecoration: 'none', width: '100%' }}>
            <Button variant="outline" size="sm" style={{ width: '100%' }}>
              View Note
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default RecommendationCard;
