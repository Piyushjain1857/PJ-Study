import React, { useState, useEffect } from 'react';
import '../../styles/notes-discovery.css';

/**
 * Prominent debounced search bar with instant query clearance and accessible SVG controls.
 */
export function NotesSearchBar({
  value = '',
  onChange,
  placeholder = 'Search notes, subjects, topics...',
  totalCount = null,
  isLoading = false
}) {
  const [localQuery, setLocalQuery] = useState(value);

  // Synchronize internal query with external value changes (e.g. from URL params or clear)
  useEffect(() => {
    setLocalQuery(value);
  }, [value]);

  // Debounce user keystrokes (350ms) before bubbling up
  useEffect(() => {
    const handler = setTimeout(() => {
      if (localQuery !== value) {
        onChange(localQuery);
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [localQuery, value, onChange]);

  function handleClear() {
    setLocalQuery('');
    onChange('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      handleClear();
    }
  }

  return (
    <div className="notes-search-bar">
      <div className="notes-search-bar__input-wrapper">
        <svg
          className="notes-search-bar__icon-svg"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          type="search"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="notes-search-bar__input"
          aria-label="Search notes library"
          maxLength={100}
        />

        {localQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="notes-search-bar__clear-btn"
            title="Clear search query"
            aria-label="Clear search input"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {totalCount !== null && (
        <div className="notes-search-bar__count" aria-live="polite">
          {isLoading ? (
            <span className="notes-search-bar__count-loading">Searching...</span>
          ) : (
            <span>
              {totalCount} {totalCount === 1 ? 'study note' : 'study notes'} found
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default NotesSearchBar;
