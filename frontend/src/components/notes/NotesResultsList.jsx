import React from 'react';
import NoteListCard from './NoteListCard.jsx';
import Skeleton from '../common/Skeleton.jsx';
import '../../styles/notes-discovery.css';

/**
 * Compact list container for fast information-dense scanning with skeleton state.
 */
export function NotesResultsList({
  notes = [],
  isLoading = false,
  emptyState = null,
  onDownload = null
}) {
  if (isLoading) {
    return (
      <div className="notes-results-list" aria-busy="true" aria-label="Loading notes list">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="note-list-card-skeleton">
            <Skeleton width="48px" height="48px" borderRadius="8px" />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <Skeleton width="90px" height="20px" borderRadius="4px" />
                <Skeleton width="110px" height="20px" borderRadius="4px" />
              </div>
              <Skeleton
                width="70%"
                height="24px"
                borderRadius="4px"
                style={{ marginBottom: '8px' }}
              />
              <Skeleton width="95%" height="16px" borderRadius="4px" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100px' }}>
              <Skeleton width="100%" height="32px" borderRadius="6px" />
              <Skeleton width="100%" height="32px" borderRadius="6px" />
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
    <div className="notes-results-list">
      {notes.map((note) => (
        <NoteListCard key={note.id} note={note} onDownload={onDownload} />
      ))}
    </div>
  );
}

export default NotesResultsList;
