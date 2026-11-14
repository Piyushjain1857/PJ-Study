import React from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar.jsx';
import NoteStatusBadge from './NoteStatusBadge.jsx';
import './NoteCard.css';

/**
 * Editorial note card displaying curriculum metadata, author details, and file stats.
 */
export function NoteCard({
  note,
  showStatus = false,
  actions = null,
  onAction = null,
  showActions = false,
  onDownload = null
}) {
  const {
    id,
    title,
    description,
    content,
    subject,
    course,
    category,
    semester,
    uploadedBy,
    publishedAt,
    createdAt,
    status,
    fileName,
    fileSize,
    viewCount = 0,
    downloadCount = 0,
    rejectionReason
  } = note;

  // Format publication or creation date
  const displayDate = new Date(publishedAt || createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Derive file badge label
  let fileBadge = null;
  if (fileName) {
    const ext = fileName.split('.').pop()?.toUpperCase() || 'FILE';
    fileBadge = ext;
  } else if (content) {
    fileBadge = 'TEXT';
  }

  function formatBytes(bytes) {
    if (!bytes) return '';
    const num = Number(bytes);
    if (isNaN(num) || num <= 0) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(num) / Math.log(k));
    return `${parseFloat((num / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  const formattedSize = formatBytes(fileSize);

  return (
    <article className="note-card">
      <div className="note-card__header">
        <div className="note-card__tags">
          {category && <span className="note-card__category">{category.name}</span>}
          {subject && <span className="note-card__subject">{subject.name}</span>}
          {course && <span className="note-card__course">{course.name}</span>}
          {semester && <span className="note-card__semester">Sem {semester}</span>}
        </div>

        <div className="note-card__header-right">
          {showStatus && <NoteStatusBadge status={status} />}
          {fileBadge && (
            <span className="note-card__badge" title={formattedSize || fileBadge}>
              {fileBadge}
              {formattedSize && ` • ${formattedSize}`}
            </span>
          )}
        </div>
      </div>

      <h3 className="note-card__title">
        <Link to={`/notes/${id}`} className="note-card__link">
          {title}
        </Link>
      </h3>

      <p className="note-card__description">
        {description ||
          (content ? content.slice(0, 140) + '...' : 'No manuscript description provided.')}
      </p>

      {/* Show moderator feedback callout if note was rejected */}
      {status === 'REJECTED' && rejectionReason && (
        <div className="note-card__feedback">
          <span className="note-card__feedback-label">Feedback from Reviewer:</span>
          <p className="note-card__feedback-text">{rejectionReason}</p>
        </div>
      )}

      <div className="note-card__footer">
        <div className="note-card__author">
          <Avatar name={uploadedBy?.name || 'Scholar'} src={uploadedBy?.avatarUrl} size="sm" />
          <div className="note-card__author-meta">
            <span className="note-card__author-name">{uploadedBy?.name || 'Academic Scholar'}</span>
            <span className="note-card__date">{displayDate}</span>
          </div>
        </div>

        <div className="note-card__stats">
          <span
            className="note-card__stat"
            title={`${viewCount} views`}
            aria-label={`${viewCount} views`}
          >
            👁 {viewCount}
          </span>
          {downloadCount > 0 && (
            <span
              className="note-card__stat"
              title={`${downloadCount} downloads`}
              aria-label={`${downloadCount} downloads`}
            >
              📥 {downloadCount}
            </span>
          )}
        </div>
      </div>

      {actions && (
        <div className="note-card__actions">
          {typeof actions === 'function' ? actions(note, onAction) : actions}
        </div>
      )}

      {showActions && !actions && (
        <div className="note-card__discovery-actions">
          <Link to={`/notes/${id}`} className="btn btn--outline btn--sm">
            View Details
          </Link>
          {fileName && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (onDownload) {
                  onDownload(note);
                } else {
                  window.open(`/api/v1/notes/${id}/download`, '_blank');
                }
              }}
              className="btn btn--primary btn--sm"
              aria-label={`Download ${fileName}`}
            >
              📥 Download
            </button>
          )}
        </div>
      )}
    </article>
  );
}

export default NoteCard;
