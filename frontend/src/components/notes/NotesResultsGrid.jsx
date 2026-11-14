import React from 'react';
import NoteCard from './NoteCard.jsx';
import Skeleton from '../common/Skeleton.jsx';
import './NotesGrid.css';

/**
 * Responsive grid container for study note cards with skeleton loading state.
 */
export function NotesResultsGrid({
  notes = [],
  isLoading = false,
  emptyState = null,
  onDownload = null
}) {
  if (isLoading) {
    return (
      <div className="notes-grid" aria-busy="true" aria-label="Loading notes grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="note-card-skeleton">
            <div className="note-card-skeleton__header">
              <Skeleton width="80px" height="20px" borderRadius="4px" />
              <Skeleton width="50px" height="20px" borderRadius="4px" />
            </div>
            <Skeleton
              width="90%"
              height="28px"
              borderRadius="4px"
              style={{ marginBottom: '12px' }}
            />
            <Skeleton count={2} height="16px" borderRadius="4px" style={{ marginBottom: '8px' }} />
            <div className="note-card-skeleton__footer">
              <Skeleton width="32px" height="32px" circle />
              <Skeleton width="120px" height="18px" borderRadius="4px" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (notes.length === 0) {
    return emptyState || null;
  }

  return (
    <div className="notes-grid">
      {notes.map((note) => (
        <NoteCard key={note.id} note={note} showActions={true} onDownload={onDownload} />
      ))}
    </div>
  );
}

export default NotesResultsGrid;
