import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button.jsx';
import './NotesEmptyState.css';

export function NotesEmptyState({
  title = 'No Study Manuscripts Found',
  description = 'There are currently no notes matching your criteria. Try adjusting your filters or explore other academic subjects.',
  actionLabel = null,
  actionTo = null,
  onAction = null
}) {
  return (
    <div className="notes-empty-state">
      <div className="notes-empty-state__icon" aria-hidden="true">
        📚
      </div>
      <h3 className="notes-empty-state__title">{title}</h3>
      <p className="notes-empty-state__desc">{description}</p>
      {actionLabel && (actionTo || onAction) && (
        <div className="notes-empty-state__action">
          {actionTo ? (
            <Link to={actionTo}>
              <Button variant="primary">{actionLabel}</Button>
            </Link>
          ) : (
            <Button variant="primary" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default NotesEmptyState;

