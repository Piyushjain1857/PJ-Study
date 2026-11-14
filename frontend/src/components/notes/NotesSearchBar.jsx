import React, { useState, useEffect } from 'react';
import '../../styles/notes-discovery.css';

/**
 * Prominent debounced search bar with instant query clearance and result indicators.
 */
export function NotesSearchBar({
  value = '',
  onChange,
  placeholder = 'Search notes by keyword, topic, or subject...',
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
        <span className="notes-search-bar__icon" aria-hidden="true">
          🔍
        </span>
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
            ✕
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
