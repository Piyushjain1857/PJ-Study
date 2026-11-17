import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import noteService from '../../services/noteService.js';
import dashboardService from '../../services/dashboardService.js';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import NotePreview from '../../components/notes/NotePreview.jsx';
import Container from '../../components/layout/Container.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import '../../styles/notes.css';

/**
 * Professional Study Library & Note Management Hub.
 *
 * SCHOLAR VIEW:
 * - Bookmarked Notes (Saved Library) with search, instant preview, download, and unbookmark.
 * - Study Collections (Binders).
 * - Download History.
 *
 * ADMIN / SUPER ADMIN VIEW:
 * - Authored study manuscripts.
 * - Tabs: All Notes, Published Notes, Unpublished Notes.
 * - Direct publishing, editing, and deletion controls.
 */
export function MyNotesPage() {
  const { user, isSuperAdmin, isModerator } = useAuth();
  const location = useLocation();

  const isStaff = isSuperAdmin || isModerator || user?.role === 'ADMIN';

  // Determine active tab from URL search param or defaults
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialTab = queryParams.get('tab') || (isStaff ? 'all' : 'bookmarks');

  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState([]);
  const [collections, setCollections] = useState([]);
  const [downloads, setDownloads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [flashNotice, setFlashNotice] = useState(location.state?.notice || '');

  // Modals & Action States
  const [previewNote, setPreviewNote] = useState(null);
  const [deleteNoteTarget, setDeleteNoteTarget] = useState(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Sync activeTab when query param changes
  useEffect(() => {
    const tabFromUrl = queryParams.get('tab');
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [queryParams, activeTab]);

  // Load content based on role and tab
  const loadContent = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      if (!isStaff) {
        // SCHOLAR MODE
        if (activeTab === 'bookmarks') {
          const res = await noteService.getBookmarkedNotes({
            search: searchQuery.trim() || undefined,
            limit: 50
          });
          setItems(res?.items || res?.data || []);
        } else if (activeTab === 'collections') {
          const overview = await dashboardService.getOverview();
          setCollections(overview?.recentCollections || []);
        } else if (activeTab === 'downloads') {
          const res = await dashboardService.getDownloads();
          setDownloads(res?.downloads || res?.data || []);
        }
      } else {
        // STAFF (ADMIN / SUPER ADMIN) MODE
        let statusFilter = undefined;
        if (activeTab === 'published') statusFilter = 'PUBLISHED';
        if (activeTab === 'unpublished') statusFilter = 'UNPUBLISHED';

        const res = await noteService.getMyNotes({
          status: statusFilter,
          search: searchQuery.trim() || undefined,
          limit: 50
        });
        setItems(res?.items || res?.data || []);
      }
    } catch (err) {
      console.error('Failed to load library items:', err);
      setError(
        err.response?.data?.error?.message || err.message || 'Unable to load study library items.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [isStaff, activeTab, searchQuery]);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  // Remove bookmark handler
  async function handleRemoveBookmark(noteId, noteTitle) {
    if (isProcessingAction) return;
    setIsProcessingAction(true);
    try {
      await noteService.removeBookmark(noteId);
      setFlashNotice(`Removed "${noteTitle || 'Note'}" from your saved library.`);
      setItems((prev) => prev.filter((item) => item.id !== noteId));
      setTimeout(() => setFlashNotice(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to remove bookmark.');
    } finally {
      setIsProcessingAction(false);
    }
  }

  // Publish note handler (staff)
  async function handlePublishNote(noteId, noteTitle) {
    if (isProcessingAction) return;
    setIsProcessingAction(true);
    try {
      await noteService.publishNote(noteId);
      setFlashNotice(`"${noteTitle || 'Note'}" is now live and published to Scholars.`);
      loadContent();
      setTimeout(() => setFlashNotice(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to publish note.');
    } finally {
      setIsProcessingAction(false);
    }
  }

  // Unpublish note handler (staff)
  async function handleUnpublishNote(noteId, noteTitle) {
    if (isProcessingAction) return;
    setIsProcessingAction(true);
    try {
      await noteService.unpublishNote(noteId);
      setFlashNotice(`"${noteTitle || 'Note'}" has been unpublished and hidden from Scholar discovery.`);
      loadContent();
      setTimeout(() => setFlashNotice(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to unpublish note.');
    } finally {
      setIsProcessingAction(false);
    }
  }

  // Delete note handler (staff)
  async function confirmDeleteNote() {
    if (!deleteNoteTarget || isProcessingAction) return;
    setIsProcessingAction(true);
    try {
      await noteService.deleteNote(deleteNoteTarget.id);
      setFlashNotice(`"${deleteNoteTarget.title}" has been permanently deleted.`);
      setDeleteNoteTarget(null);
      loadContent();
      setTimeout(() => setFlashNotice(''), 4000);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to delete note.');
    } finally {
      setIsProcessingAction(false);
    }
  }

  // Direct download handler
  function handleDownloadNote(note) {
    if (note.fileName) {
      noteService.downloadFile(note.id, note.fileName);
    } else {
      window.open(`/api/v1/notes/${note.id}/download`, '_blank');
    }
  }

  return (
    <div className="notes-page">
      <Container>
        {/* Header Ribbon */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '28px'
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--color-primary, #0f766e)',
                  background: 'var(--color-primary-subtle, #edf5f0)',
                  padding: '3px 8px',
                  borderRadius: '4px'
                }}
              >
                {isStaff ? 'Academic Staff' : 'K.R. Mangalam University'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                {isStaff ? 'Faculty Operations' : 'Verified Scholar'}
              </span>
            </div>

            <h1 className="notes-page__title" style={{ marginBottom: '6px', fontSize: '1.75rem' }}>
              {isStaff ? 'My Uploaded Notes' : 'My Study Library'}
            </h1>
            <p className="notes-page__subtitle" style={{ maxWidth: '640px' }}>
              {isStaff
                ? 'Author, publish, and manage curriculum manuscripts directly for students.'
                : 'Organize your saved study materials, review download history, and access course binders in one place.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {isStaff ? (
              <Link to="/notes/new">
                <Button variant="primary" size="md">
                  <span>+</span> Upload Note
                </Button>
              </Link>
            ) : (
              <Link to="/notes/explore">
                <Button variant="outline" size="md">
                  Explore More Notes
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Flash banner */}
        {flashNotice && (
          <div
            className="note-form__alert note-form__alert--success"
            style={{
              backgroundColor: '#eef8f2',
              color: '#1b633b',
              border: '1px solid #bbf7d0',
              marginBottom: '20px',
              padding: '12px 16px',
              borderRadius: '8px'
            }}
            role="status"
          >
            ✓ {flashNotice}
          </div>
        )}

        {error && (
          <div
            className="note-form__alert note-form__alert--danger"
            style={{
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              marginBottom: '20px',
              padding: '12px 16px',
              borderRadius: '8px'
            }}
            role="alert"
          >
            ⚠ {error}
          </div>
        )}

        {/* Tab Controls & Filter Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '24px',
            borderBottom: '1px solid var(--color-border)',
            paddingBottom: '12px'
          }}
        >
          {/* Tabs */}
          <div className="notes-tabs" role="tablist" style={{ borderBottom: 'none', margin: 0 }}>
            {!isStaff ? (
              <>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'bookmarks'}
                  className={`notes-tab ${activeTab === 'bookmarks' ? 'notes-tab--active' : ''}`}
                  onClick={() => setActiveTab('bookmarks')}
                >
                  Saved Notes
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'collections'}
                  className={`notes-tab ${activeTab === 'collections' ? 'notes-tab--active' : ''}`}
                  onClick={() => setActiveTab('collections')}
                >
                  My Collections
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'downloads'}
                  className={`notes-tab ${activeTab === 'downloads' ? 'notes-tab--active' : ''}`}
                  onClick={() => setActiveTab('downloads')}
                >
                  Download History
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'all'}
                  className={`notes-tab ${activeTab === 'all' ? 'notes-tab--active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  All Notes
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'published'}
                  className={`notes-tab ${activeTab === 'published' ? 'notes-tab--active' : ''}`}
                  onClick={() => setActiveTab('published')}
                >
                  Published Notes
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'unpublished'}
                  className={`notes-tab ${activeTab === 'unpublished' ? 'notes-tab--active' : ''}`}
                  onClick={() => setActiveTab('unpublished')}
                >
                  Unpublished Notes
                </button>
              </>
            )}
          </div>

          {/* Quick Filter Search */}
          {(activeTab === 'bookmarks' || isStaff) && (
            <div style={{ minWidth: '220px' }}>
              <input
                type="text"
                placeholder="Filter notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 12px',
                  fontSize: '0.8125rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--color-surface)',
                  color: 'var(--color-text-primary)'
                }}
              />
            </div>
          )}
        </div>

        {/* Main Content Area */}
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            <Skeleton height="160px" count={3} />
          </div>
        ) : (
          <>
            {/* VIEW 1: SCHOLAR SAVED NOTES (BOOKMARKS) */}
            {!isStaff && activeTab === 'bookmarks' && (
              <div>
                {items.length === 0 ? (
                  <EmptyState
                    title="No Saved Notes Yet"
                    description={
                      searchQuery
                        ? `No saved notes match "${searchQuery}".`
                        : 'You haven\'t bookmarked any notes yet. Browse the catalog to save lecture materials for quick access.'
                    }
                    actionLabel="Explore Academic Catalog"
                    actionTo="/notes/explore"
                  />
                ) : (
                  <div className="dashboard-grid-cards">
                    {items.map((note) => (
                      <article key={note.id} className="dashboard-note-card">
                        <div className="dashboard-note-card__top">
                          <span className="dashboard-note-card__tag">
                            {note.subject?.name || 'General Subject'}
                          </span>
                          <span className="dashboard-note-card__badge">
                            {typeof note.fileName === 'string' && note.fileName.includes('.')
                              ? note.fileName.split('.').pop()?.toUpperCase()
                              : 'DOC'}
                          </span>
                        </div>

                        <h3 className="dashboard-note-card__title">
                          <Link to={`/notes/${note.id}`} className="dashboard-note-card__link">
                            {note.title}
                          </Link>
                        </h3>

                        <div className="dashboard-note-card__meta">
                          {note.course?.name && <span>{note.course.name}</span>}
                          {note.semester && <span>Sem {note.semester}</span>}
                          {note.downloadCount > 0 && <span>{note.downloadCount} downloads</span>}
                        </div>

                        <div className="dashboard-note-card__actions" style={{ display: 'flex', gap: '8px', marginTop: '14px', alignItems: 'center' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setPreviewNote(note)}
                            style={{ flex: 1 }}
                          >
                            Preview
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleDownloadNote(note)}
                            style={{ flex: 1 }}
                          >
                            Download
                          </Button>
                          <button
                            type="button"
                            onClick={() => handleRemoveBookmark(note.id, note.title)}
                            disabled={isProcessingAction}
                            title="Remove from saved notes"
                            style={{
                              border: '1px solid var(--color-border)',
                              background: 'transparent',
                              borderRadius: '6px',
                              padding: '6px 8px',
                              cursor: 'pointer',
                              color: 'var(--color-danger, #ef4444)'
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: SCHOLAR COLLECTIONS */}
            {!isStaff && activeTab === 'collections' && (
              <div>
                {collections.length === 0 ? (
                  <EmptyState
                    title="No Study Collections"
                    description="Collections let you organize notes into thematic binders for exams or assignments."
                    actionLabel="Explore Notes"
                    actionTo="/notes/explore"
                  />
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                    {collections.map((col) => (
                      <div
                        key={col.id}
                        style={{
                          backgroundColor: 'var(--color-surface, #ffffff)',
                          border: '1px solid var(--color-border, #e2e8f0)',
                          borderRadius: '10px',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}
                      >
                        <div style={{ fontSize: '24px' }}>📁</div>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                          {col.name}
                        </h4>
                        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-secondary)' }}>
                          {col.description || 'Custom collection binder'}
                        </p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: 'auto' }}>
                          {col.itemCount || 0} notes organized
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 3: SCHOLAR DOWNLOAD HISTORY */}
            {!isStaff && activeTab === 'downloads' && (
              <div>
                {downloads.length === 0 ? (
                  <EmptyState
                    title="No Downloads Yet"
                    description="When you download PDF notes or study materials, they will appear here for fast re-access."
                    actionLabel="Explore Notes"
                    actionTo="/notes/explore"
                  />
                ) : (
                  <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-subtle)' }}>
                          <th style={{ padding: '12px 16px', fontWeight: 600 }}>Note Title</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600 }}>Downloaded At</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {downloads.map((d) => (
                          <tr key={d.id || d.note?.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                            <td style={{ padding: '12px 16px', fontWeight: 500 }}>
                              <Link to={`/notes/${d.note?.id || d.id}`} style={{ color: 'var(--color-primary)' }}>
                                {d.note?.title || d.title || 'Study Manuscript'}
                              </Link>
                            </td>
                            <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                              {new Date(d.downloadedAt || d.createdAt || Date.now()).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </td>
                            <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadNote(d.note || d)}
                              >
                                Re-Download
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* VIEW 4: STAFF (ADMIN / SUPER ADMIN) AUTHORED NOTES */}
            {isStaff && (
              <div>
                {items.length === 0 ? (
                  <EmptyState
                    title="No Notes Found"
                    description={
                      searchQuery
                        ? `No notes match "${searchQuery}".`
                        : 'You haven\'t uploaded any notes matching this filter.'
                    }
                    actionLabel="+ Upload Note"
                    actionTo="/notes/new"
                  />
                ) : (
                  <div style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '10px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-surface-subtle)' }}>
                          <th style={{ padding: '12px 16px', fontWeight: 600 }}>Title</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600 }}>Curriculum</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600 }}>Status</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600 }}>Downloads</th>
                          <th style={{ padding: '12px 16px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((n) => {
                          const isPub = n.status === 'PUBLISHED' || n.status === 'APPROVED';
                          return (
                            <tr key={n.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                              <td style={{ padding: '12px 16px' }}>
                                <Link to={`/notes/${n.id}`} style={{ fontWeight: 600, color: 'var(--color-text-primary)', textDecoration: 'none' }}>
                                  {n.title}
                                </Link>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: '2px' }}>
                                  {n.fileName || 'Rich Content Document'}
                                </div>
                              </td>
                              <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }}>
                                <div>{n.subject?.name || n.subjectName || 'General'}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>
                                  {n.course?.name} • Sem {n.semester}
                                </div>
                              </td>
                              <td style={{ padding: '12px 16px' }}>
                                <span
                                  style={{
                                    display: 'inline-block',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    backgroundColor: isPub ? '#e6f4ea' : '#fef7e0',
                                    color: isPub ? '#137333' : '#b06000'
                                  }}
                                >
                                  {isPub ? 'Published' : 'Unpublished'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                                {n.downloadCount || n.downloads || 0}
                              </td>
                              <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                  <Link to={`/notes/${n.id}/edit`}>
                                    <Button variant="outline" size="sm">
                                      Edit
                                    </Button>
                                  </Link>
                                  {isPub ? (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleUnpublishNote(n.id, n.title)}
                                      disabled={isProcessingAction}
                                    >
                                      Unpublish
                                    </Button>
                                  ) : (
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      onClick={() => handlePublishNote(n.id, n.title)}
                                      disabled={isProcessingAction}
                                    >
                                      Publish
                                    </Button>
                                  )}
                                  <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => setDeleteNoteTarget(n)}
                                    disabled={isProcessingAction}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Inline Note Preview Modal */}
        {previewNote && (
          <Modal
            isOpen={Boolean(previewNote)}
            onClose={() => setPreviewNote(null)}
            title={previewNote.title}
            description={`${previewNote.subject?.name || 'Subject'} • Sem ${previewNote.semester || 1}`}
            size="lg"
          >
            <div style={{ maxHeight: '70vh', overflowY: 'auto', padding: '8px 0' }}>
              <NotePreview note={previewNote} previewUrl={noteService.getFilePreviewUrl(previewNote.id)} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--color-border)' }}>
              <Button variant="outline" onClick={() => setPreviewNote(null)}>
                Close Preview
              </Button>
              <Button variant="primary" onClick={() => handleDownloadNote(previewNote)}>
                Download Manuscript
              </Button>
            </div>
          </Modal>
        )}

        {/* Delete Confirmation Modal */}
        {deleteNoteTarget && (
          <Modal
            isOpen={Boolean(deleteNoteTarget)}
            onClose={() => setDeleteNoteTarget(null)}
            title="Delete Study Note"
          >
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
              Are you sure you want to permanently delete{' '}
              <strong>"{deleteNoteTarget.title}"</strong>? This will remove the manuscript from Scholar discovery.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button
                variant="outline"
                onClick={() => setDeleteNoteTarget(null)}
                disabled={isProcessingAction}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={confirmDeleteNote}
                disabled={isProcessingAction}
              >
                {isProcessingAction ? 'Deleting...' : 'Delete Note'}
              </Button>
            </div>
          </Modal>
        )}
      </Container>
    </div>
  );
}

export default MyNotesPage;
