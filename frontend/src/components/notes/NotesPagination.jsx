import React from 'react';
import '../../styles/notes-discovery.css';

/**
 * Accessible server-side pagination with range calculations and page jumps.
 */
export function NotesPagination({
  page = 1,
  totalPages = 1,
  totalItems = 0,
  limit = 12,
  onPageChange
}) {
  if (totalPages <= 1 && totalItems <= limit) {
    return null;
  }

  // Calculate item range currently displayed
  const startItem = totalItems === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  // Generate page numbers to render (e.g. window of up to 5 pages around current)
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav className="notes-pagination-root" aria-label="Notes pagination navigation">
      <div className="notes-pagination-root__info">
        Showing <strong>{startItem}</strong>–<strong>{endItem}</strong> of{' '}
        <strong>{totalItems}</strong> notes
      </div>

      <div className="notes-pagination-root__controls">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="notes-pagination-root__nav-btn"
          aria-label="Previous page"
        >
          ← Prev
        </button>

        {pages[0] > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className="notes-pagination-root__page-btn"
            >
              1
            </button>
            {pages[0] > 2 && <span className="notes-pagination-root__ellipsis">…</span>}
          </>
        )}

        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`notes-pagination-root__page-btn ${
              p === page ? 'notes-pagination-root__page-btn--active' : ''
            }`}
            aria-current={p === page ? 'page' : undefined}
          >
            {p}
          </button>
        ))}

        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <span className="notes-pagination-root__ellipsis">…</span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              className="notes-pagination-root__page-btn"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="notes-pagination-root__nav-btn"
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
    </nav>
  );
}

export default NotesPagination;
