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
        <span className="notes-sort-control__arrow" aria-hidden="true">
          ▾
        </span>
      </div>
    </div>
  );
}

export default NotesSortControl;
