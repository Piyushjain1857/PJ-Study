import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import noteService from '../../services/noteService.js';
import subjectService from '../../services/subjectService.js';
import categoryService from '../../services/categoryService.js';
import NoteForm from '../../components/notes/NoteForm.jsx';
import Container from '../../components/layout/Container.jsx';
import '../../styles/notes.css';

/**
 * Scholar manuscript creation workspace.
 */
export function CreateNotePage() {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    async function loadTaxonomies() {
      try {
        const [subjData, catData] = await Promise.all([
          subjectService.listSubjects(),
          categoryService.listCategories()
        ]);
        setSubjects(subjData || []);
        setCategories(catData || []);
      } catch {
        setSubmitError('Failed to load academic curriculum subjects. Please refresh the page.');
      }
    }
    loadTaxonomies();
  }, []);

  async function handleSubmit(payload, action) {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await noteService.createNote(payload);
      // Navigate to My Notes dashboard
      navigate('/my-notes', {
        state: {
          notice:
            action === 'submit'
              ? 'Your study manuscript has been submitted for moderation review.'
              : 'Your note draft was saved successfully.'
        }
      });
    } catch (err) {
      setSubmitError(
        err.response?.data?.error?.message || err.message || 'Failed to create note manuscript.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="notes-page">
      <Container size="md">
        <header className="notes-page__header">
          <span className="notes-page__eyebrow">Academic Desk</span>
          <h1 className="notes-page__title">Create Study Note</h1>
          <p className="notes-page__subtitle">
            Draft lecture notes or attach documents to contribute to your personal archive and the
            university study community.
          </p>
        </header>

        <NoteForm
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

export default CreateNotePage;
