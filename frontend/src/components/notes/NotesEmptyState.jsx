import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button.jsx';
import './NotesEmptyState.css';

/**
 * Compact, elegant empty state component for academic notes exploration.
 */
export function NotesEmptyState({
  title = 'No study notes available yet',
  description = 'Approved study resources will appear here when available.',
  actionLabel = null,
  actionTo = null,
  onAction = null
}) {
  return (
    <div className="notes-empty-state">
      <div className="notes-empty-state__icon-wrapper" aria-hidden="true">
        <svg
          className="notes-empty-state__icon"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          <path d="M8 7h8" />
          <path d="M8 11h6" />
        </svg>
      </div>

      <h3 className="notes-empty-state__title">{title}</h3>
      <p className="notes-empty-state__desc">{description}</p>

      {actionLabel && (actionTo || onAction) && (
        <div className="notes-empty-state__action">
          {actionTo ? (
            <Link to={actionTo}>
              <Button variant="primary" size="sm">
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button variant="outline" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default NotesEmptyState;
