import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import noteService from '../../services/noteService.js';
import NotesGrid from '../../components/notes/NotesGrid.jsx';
import NotesEmptyState from '../../components/notes/NotesEmptyState.jsx';
import Button from '../../components/common/Button.jsx';
import Modal from '../../components/common/Modal.jsx';
import Container from '../../components/layout/Container.jsx';
import '../../styles/notes.css';

const STATUS_TABS = [
  { id: '', label: 'All Notes' },
  { id: 'DRAFT', label: 'Drafts' },
  { id: 'PENDING_REVIEW', label: 'In Review' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'ARCHIVED', label: 'Archived' }
];

/**
 * Scholar personal notes dashboard for tracking submission lifecycle.
 */
export function MyNotesPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('');
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [flashNotice, setFlashNotice] = useState(location.state?.notice || '');

  // Deletion modal state
  const [deleteNoteTarget, setDeleteNoteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch current user notes
  const fetchMyNotes = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await noteService.getMyNotes({
        status: activeTab || undefined,
        limit: 50
      });
      const items = res?.items || res?.data || [];
      setNotes(items);
    } catch (err) {
      setError(
        err.response?.data?.error?.message || err.message || 'Failed to load your study notes.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchMyNotes();
  }, [fetchMyNotes]);

  // Submit draft for review
  async function handleSubmitForReview(noteId) {
    try {
      await noteService.submitForReview(noteId);
      setFlashNotice('Your manuscript has been submitted for moderation review.');
      fetchMyNotes();
    } catch (err) {
      setError(
        err.response?.data?.error?.message || err.message || 'Failed to submit note for review.'
      );
    }
  }

  // Archive approved note
  async function handleArchive(noteId) {
    try {
      await noteService.archiveNote(noteId);
      setFlashNotice('Note has been moved to your archives.');
      fetchMyNotes();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to archive note.');
    }
  }

  // Confirm delete
  async function confirmDelete() {
    if (!deleteNoteTarget) return;
    setIsDeleting(true);
    try {
      await noteService.deleteNote(deleteNoteTarget.id);
      setFlashNotice('Note has been deleted.');
      setDeleteNoteTarget(null);
      fetchMyNotes();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to delete note.');
    } finally {
      setIsDeleting(false);
    }
  }

  // Render contextual action buttons per note status
  function renderNoteActions(note) {
    return (
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {note.status === 'DRAFT' && (
          <>
            <Link to={`/notes/${note.id}/edit`}>
              <Button size="sm" variant="outline">
                Edit
              </Button>
            </Link>
            <Button size="sm" variant="primary" onClick={() => handleSubmitForReview(note.id)}>
              Submit for Review
            </Button>
            <Button size="sm" variant="danger" onClick={() => setDeleteNoteTarget(note)}>
              Delete
            </Button>
          </>
        )}

        {(note.status === 'PENDING' || note.status === 'PENDING_REVIEW') && (
          <span
            style={{
              fontSize: '0.8125rem',
              color: '#b45309',
              fontWeight: 500
            }}
          >
            ⏳ Under review by moderators
          </span>
        )}

        {note.status === 'REJECTED' && (
          <>
            <Link to={`/notes/${note.id}/edit`}>
              <Button size="sm" variant="primary">
                Edit & Resubmit
              </Button>
            </Link>
            <Button size="sm" variant="danger" onClick={() => setDeleteNoteTarget(note)}>
              Delete
            </Button>
          </>
        )}

        {note.status === 'APPROVED' && (
          <>
            <Link to={`/notes/${note.id}`}>
              <Button size="sm" variant="outline">
                View Public
              </Button>
            </Link>
            {note.fileName && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => noteService.downloadFile(note.id, note.fileName)}
              >
                Download
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => handleArchive(note.id)}>
              Archive
            </Button>
          </>
        )}

        {note.status === 'ARCHIVED' && (
          <>
            <Link to={`/notes/${note.id}`}>
              <Button size="sm" variant="outline">
                View
              </Button>
            </Link>
            {note.fileName && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => noteService.downloadFile(note.id, note.fileName)}
              >
                Download
              </Button>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="notes-page">
      <Container>
        {/* Header with Upload CTA */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px',
            marginBottom: '32px'
          }}
        >
          <div>
            <span className="notes-page__eyebrow">Scholar Workspace</span>
            <h1 className="notes-page__title" style={{ marginBottom: '8px' }}>
              My Notes & Manuscripts
            </h1>
            <p className="notes-page__subtitle">
              Manage your personal study drafts, track moderation review status, and organize your
              published academic contributions.
            </p>
          </div>

          <Link to="/notes/new">
            <Button variant="primary">+ Upload Note</Button>
          </Link>
        </div>

        {/* Flash banner */}
        {flashNotice && (
          <div
            className="note-form__alert note-form__alert--success"
            style={{
              backgroundColor: '#eef8f2',
              color: '#1b633b',
              border: '1px solid #bbf7d0',
              marginBottom: '24px'
            }}
            role="status"
          >
            {flashNotice}
          </div>
        )}

        {error && (
          <div
            className="note-form__alert note-form__alert--danger"
            style={{ marginBottom: '24px' }}
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Status navigation tabs */}
        <div className="notes-tabs" role="tablist">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`notes-tab ${activeTab === tab.id ? 'notes-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notes Grid */}
        <NotesGrid
          notes={notes}
          isLoading={isLoading}
          showStatus={true}
          actions={renderNoteActions}
          emptyState={
            <NotesEmptyState
              title={
                activeTab === 'DRAFT'
                  ? 'No Draft Manuscripts'
                  : activeTab === 'PENDING_REVIEW'
                    ? 'No Notes in Review'
                    : activeTab === 'APPROVED'
                      ? 'No Approved Notes Yet'
                      : activeTab === 'REJECTED'
                        ? 'No Rejected Notes'
                        : 'You Have Not Uploaded Any Notes Yet'
              }
              description={
                activeTab === 'DRAFT'
                  ? 'You currently have no saved drafts. Start writing a new study note manuscript.'
                  : 'Contribute your class lecture notes or exam study guides to the PJ Study community.'
              }
              actionLabel="+ Create Study Note"
              actionTo="/notes/new"
            />
          }
        />

        {/* Delete Confirmation Modal */}
        {deleteNoteTarget && (
          <Modal
            isOpen={Boolean(deleteNoteTarget)}
            onClose={() => setDeleteNoteTarget(null)}
            title="Delete Study Note"
          >
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
              Are you sure you want to permanently delete{' '}
              <strong>"{deleteNoteTarget.title}"</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button
                variant="outline"
                onClick={() => setDeleteNoteTarget(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete Note'}
              </Button>
            </div>
          </Modal>
        )}
      </Container>
    </div>
  );
}

export default MyNotesPage;
