import React from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../common/Avatar.jsx';
import NoteStatusBadge from './NoteStatusBadge.jsx';
import noteService from '../../services/noteService.js';
import './NoteCard.css';

/**
 * High-density list view card for scanning and discovering academic notes.
 */
export function NoteListCard({ note, showStatus = false, onDownload = null }) {
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
    mimeType,
    viewCount = 0,
    downloadCount = 0,
    averageRating = 0,
    totalReviews = 0
  } = note;

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

  async function handleDirectDownload(e) {
    e.preventDefault();
    e.stopPropagation();
    if (onDownload) {
      onDownload(note);
    } else {
      await noteService.downloadFile(id, fileName || `${title}.pdf`);
    }
  }

  return (
    <article className="note-list-card">
      <div className="note-list-card__icon-col">
        <div className="note-list-card__file-badge" title={mimeType || 'Document'}>
          {fileBadge || 'DOC'}
        </div>
      </div>

      <div className="note-list-card__main-col">
        <div className="note-list-card__tags">
          {category && <span className="note-card__category">{category.name}</span>}
          {subject && <span className="note-card__subject">{subject.name}</span>}
          {course && <span className="note-card__course">{course.name}</span>}
          {semester && <span className="note-card__semester">Sem {semester}</span>}
          {showStatus && <NoteStatusBadge status={status} />}
        </div>

        <h3 className="note-list-card__title">
          <Link to={`/notes/${id}`} className="note-card__link">
            {title}
          </Link>
        </h3>

        <p className="note-list-card__desc">
          {description || (content ? content.slice(0, 160) + '...' : 'No description provided.')}
        </p>

        <div className="note-list-card__meta-bar">
          <div className="note-list-card__author">
            {uploadedBy?.id ? (
              <Link
                to={`/contributors/${uploadedBy.id}`}
                className="note-list-card__author-link"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                  color: 'inherit'
                }}
              >
                <Avatar
                  name={uploadedBy?.name || 'Scholar'}
                  src={uploadedBy?.avatarUrl}
                  size="xs"
                />
                <span className="note-list-card__author-name">
                  {uploadedBy?.name || 'Academic Scholar'}
                </span>
              </Link>
            ) : (
              <>
                <Avatar
                  name={uploadedBy?.name || 'Scholar'}
                  src={uploadedBy?.avatarUrl}
                  size="xs"
                />
                <span className="note-list-card__author-name">
                  {uploadedBy?.name || 'Academic Scholar'}
                </span>
              </>
            )}
            <span className="note-list-card__bullet">•</span>
            <span className="note-list-card__date">{displayDate}</span>
          </div>

          <div className="note-list-card__stats">
            {totalReviews > 0 ? (
              <>
                <span
                  className="note-list-card__stat-item"
                  title={`${totalReviews} reviews, average ${Number(averageRating).toFixed(1)}`}
                  style={{ color: '#b45309', fontWeight: 600 }}
                >
                  ★ {Number(averageRating).toFixed(1)} ({totalReviews})
                </span>
                <span className="note-list-card__bullet">•</span>
              </>
            ) : (
              <>
                <span
                  className="note-list-card__stat-item"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Not rated yet
                </span>
                <span className="note-list-card__bullet">•</span>
              </>
            )}
            {formattedSize && (
              <>
                <span className="note-list-card__stat-item" title="File Size">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  </svg>
                  {formattedSize}
                </span>
                <span className="note-list-card__bullet">•</span>
              </>
            )}
            <span className="note-list-card__stat-item" title={`${viewCount} views`}>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {viewCount}
            </span>
            {downloadCount > 0 && (
              <>
                <span className="note-list-card__bullet">•</span>
                <span className="note-list-card__stat-item" title={`${downloadCount} downloads`}>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {downloadCount}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="note-list-card__actions-col">
        <Link to={`/notes/${id}`} className="btn btn--outline btn--sm">
          View Details
        </Link>
        {fileName && (
          <button
            type="button"
            onClick={handleDirectDownload}
            className="btn btn--primary btn--sm"
            title="Download file"
            aria-label={`Download ${fileName}`}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ marginRight: '4px' }}
              aria-hidden="true"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download
          </button>
        )}
      </div>
    </article>
  );
}

export default NoteListCard;
