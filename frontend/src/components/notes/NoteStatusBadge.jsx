import React from 'react';
import './NoteStatusBadge.css';

/**
 * Visual badge indicating current note lifecycle status.
 *
 * @param {{ status: 'DRAFT' | 'PENDING' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED' }} props
 */
export function NoteStatusBadge({ status }) {
  const normalized = (status || 'DRAFT').toUpperCase();

  let variant = 'default';
  let label = 'Draft';

  switch (normalized) {
    case 'DRAFT':
      variant = 'draft';
      label = 'Draft';
      break;
    case 'PENDING':
    case 'PENDING_REVIEW':
      variant = 'pending';
      label = 'Under Review';
      break;
    case 'APPROVED':
      variant = 'approved';
      label = 'Approved';
      break;
    case 'REJECTED':
      variant = 'rejected';
      label = 'Revision Requested';
      break;
    case 'ARCHIVED':
      variant = 'archived';
      label = 'Archived';
      break;
    default:
      variant = 'default';
      label = status;
  }

  return (
    <span className={`note-status-badge note-status-badge--${variant}`}>
      <span className="note-status-badge__dot" aria-hidden="true" />
      {label}
    </span>
  );
}

export default NoteStatusBadge;
