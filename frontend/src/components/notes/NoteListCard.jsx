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
    downloadCount = 0
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
            <Avatar name={uploadedBy?.name || 'Scholar'} src={uploadedBy?.avatarUrl} size="xs" />
            <span className="note-list-card__author-name">
              {uploadedBy?.name || 'Academic Scholar'}
            </span>
            <span className="note-list-card__bullet">•</span>
            <span className="note-list-card__date">{displayDate}</span>
          </div>

          <div className="note-list-card__stats">
            {formattedSize && (
              <>
                <span className="note-list-card__stat-item" title="File Size">
                  📦 {formattedSize}
                </span>
                <span className="note-list-card__bullet">•</span>
              </>
            )}
            <span className="note-list-card__stat-item" title={`${viewCount} views`}>
              👁 {viewCount}
            </span>
            {downloadCount > 0 && (
              <>
                <span className="note-list-card__bullet">•</span>
                <span className="note-list-card__stat-item" title={`${downloadCount} downloads`}>
                  📥 {downloadCount}
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
            📥 Download
          </button>
        )}
      </div>
    </article>
  );
}

export default NoteListCard;
