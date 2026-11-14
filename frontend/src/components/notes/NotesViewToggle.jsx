import React from 'react';
import '../../styles/notes-discovery.css';

/**
 * Toggle control between responsive Grid card view and dense List table view.
 */
export function NotesViewToggle({ view = 'grid', onChange }) {
  return (
    <div className="notes-view-toggle" role="group" aria-label="Layout view presentation mode">
      <button
        type="button"
        className={`notes-view-toggle__btn ${view === 'grid' ? 'notes-view-toggle__btn--active' : ''}`}
        onClick={() => onChange('grid')}
        aria-pressed={view === 'grid'}
        title="Grid card view"
        aria-label="Switch to Grid view"
      >
        <svg
          className="notes-view-toggle__icon"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <span className="notes-view-toggle__label">Grid</span>
      </button>

      <button
        type="button"
        className={`notes-view-toggle__btn ${view === 'list' ? 'notes-view-toggle__btn--active' : ''}`}
        onClick={() => onChange('list')}
        aria-pressed={view === 'list'}
        title="Compact list view"
        aria-label="Switch to List view"
      >
        <svg
          className="notes-view-toggle__icon"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <span className="notes-view-toggle__label">List</span>
      </button>
    </div>
  );
}

export default NotesViewToggle;
