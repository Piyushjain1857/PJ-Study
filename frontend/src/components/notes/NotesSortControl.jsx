import React from 'react';
import '../../styles/notes-discovery.css';

/**
 * Accessible sort dropdown for notes discovery ordering.
 */
export function NotesSortControl({ value = 'newest', onChange }) {
  return (
    <div className="notes-sort-control">
      <label htmlFor="notes-sort-dropdown" className="notes-sort-control__label">
        Sort:
      </label>
      <div className="notes-sort-control__select-wrapper">
        <select
          id="notes-sort-dropdown"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="notes-sort-control__select"
          aria-label="Sort notes by"
        >
          <option value="newest">Recently Published</option>
          <option value="downloads">Most Downloaded</option>
          <option value="views">Most Viewed</option>
          <option value="title_asc">Title (A → Z)</option>
          <option value="title_desc">Title (Z → A)</option>
          <option value="oldest">Earliest Published</option>
        </select>
        <svg
          className="notes-sort-control__arrow"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
}

export default NotesSortControl;
