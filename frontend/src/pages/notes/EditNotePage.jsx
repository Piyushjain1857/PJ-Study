import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import noteService from '../../services/noteService.js';
import subjectService from '../../services/subjectService.js';
import categoryService from '../../services/categoryService.js';
import NoteForm from '../../components/notes/NoteForm.jsx';
import Container from '../../components/layout/Container.jsx';
import Skeleton from '../../components/common/Skeleton.jsx';
import '../../styles/notes.css';

/**
 * Scholar note editing and revision workspace.
 */
export function EditNotePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [note, setNote] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setLoadError('');
      try {
        const [noteData, subjData, catData] = await Promise.all([
          noteService.getNoteById(id),
          subjectService.listSubjects(),
          categoryService.listCategories()
        ]);
        setNote(noteData);
        setSubjects(subjData || []);
        setCategories(catData || []);
      } catch (err) {
        setLoadError(
          err.response?.data?.error?.message || err.message || 'Unable to load note for editing.'
        );
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  async function handleSubmit(payload, action) {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      // 1. Update note details
      await noteService.updateNote(id, payload);

      // 2. If user chose 'Submit for Review', trigger submission endpoint
      if (action === 'submit') {
        await noteService.submitForReview(id);
      }

      navigate('/my-notes', {
        state: {
          notice:
            action === 'submit'
              ? 'Your revised manuscript was submitted for review.'
              : 'Your note changes have been saved.'
        }
      });
    } catch (err) {
      setSubmitError(
        err.response?.data?.error?.message || err.message || 'Failed to update note manuscript.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="notes-page">
        <Container size="md">
          <Skeleton width="180px" height="24px" style={{ marginBottom: '12px' }} />
          <Skeleton width="340px" height="40px" style={{ marginBottom: '24px' }} />
          <Skeleton count={4} height="52px" style={{ marginBottom: '16px' }} />
        </Container>
      </div>
    );
  }

  if (loadError || !note) {
    return (
      <div className="notes-page">
        <Container size="md">
          <div className="note-form__alert note-form__alert--danger" role="alert">
            {loadError || 'Note manuscript was not found.'}
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="notes-page">
      <Container size="md">
        <header className="notes-page__header">
          <span className="notes-page__eyebrow">Manuscript Revision</span>
          <h1 className="notes-page__title">Edit Note Manuscript</h1>
          <p className="notes-page__subtitle">
            Update syllabus topics, descriptions, or upload replacement study files.
          </p>
        </header>

        {/* Rejection feedback banner if note needs revision */}
        {note.status === 'REJECTED' && note.rejectionReason && (
          <div
            className="note-card__feedback"
            style={{ marginBottom: '24px', padding: '16px 20px' }}
          >
            <span className="note-card__feedback-label" style={{ fontSize: '0.875rem' }}>
              Moderator Revision Notes:
            </span>
            <p
              className="note-card__feedback-text"
              style={{ fontSize: '0.9375rem', marginTop: '6px' }}
            >
              {note.rejectionReason}
            </p>
          </div>
        )}

        <NoteForm
          initialValues={{
            title: note.title,
            description: note.description || '',
            subjectId: note.subjectId,
            categoryId: note.categoryId || '',
            semester: note.semester || '',
            academicYear: note.academicYear || '',
            content: note.content || '',
            fileName: note.fileName || ''
          }}
          subjects={subjects}
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/my-notes')}
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      </Container>
    </div>
  );
}

export default EditNotePage;
