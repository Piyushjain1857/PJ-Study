import React from 'react';
import './NoteFilters.css';

/**
 * Filter and search bar for exploring notes in the academic library.
 */
export function NoteFilters({
  search,
  onSearchChange,
  subjectId,
  onSubjectChange,
  categoryId,
  onCategoryChange,
  semester,
  onSemesterChange,
  sortBy,
  onSortChange,
  subjects = [],
  categories = [],
  onReset
}) {
  const hasActiveFilters =
    Boolean(search) ||
    Boolean(subjectId) ||
    Boolean(categoryId) ||
    Boolean(semester) ||
    sortBy !== 'newest';

  return (
    <div className="note-filters-root">
      <div className="note-filters-primary">
        {/* Search Bar */}
        <div className="note-filters-search">
          <span className="note-filters-search__icon" aria-hidden="true">
            🔍
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notes by title, topic, or keyword..."
            className="note-filters-search__input"
            aria-label="Search notes"
          />
          {search && (
            <button
              type="button"
              className="note-filters-search__clear"
              onClick={() => onSearchChange('')}
              aria-label="Clear search query"
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort selector */}
        <div className="note-filters-sort">
          <label htmlFor="note-sort-select" className="note-filters-label">
            Sort by:
          </label>
          <select
            id="note-sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="note-filters-select"
          >
            <option value="newest">Recently Published</option>
            <option value="mostViewed">Most Viewed</option>
            <option value="mostDownloaded">Most Downloaded</option>
            <option value="oldest">Earliest Published</option>
          </select>
        </div>
      </div>

      {/* Secondary filter row */}
      <div className="note-filters-secondary">
        {/* Subject filter */}
        <div className="note-filters-item">
          <select
            value={subjectId}
            onChange={(e) => onSubjectChange(e.target.value)}
            className="note-filters-select"
            aria-label="Filter by subject"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category filter */}
        <div className="note-filters-item">
          <select
            value={categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="note-filters-select"
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Semester filter */}
        <div className="note-filters-item">
          <select
            value={semester}
            onChange={(e) => onSemesterChange(e.target.value)}
            className="note-filters-select"
            aria-label="Filter by semester"
          >
            <option value="">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
        </div>

        {/* Reset button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="note-filters-reset"
            aria-label="Reset all filters"
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
}

export default NoteFilters;
