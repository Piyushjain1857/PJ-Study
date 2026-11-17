import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import noteService from '../../services/noteService.js';
import courseService from '../../services/courseService.js';
import subjectService from '../../services/subjectService.js';
import categoryService from '../../services/categoryService.js';
import NoteForm from '../../components/notes/NoteForm.jsx';
import Container from '../../components/layout/Container.jsx';
import Button from '../../components/common/Button.jsx';
import SEO from '../../components/common/SEO.jsx';
import '../../styles/notes.css';

/**
 * Scholar manuscript creation workspace.
 */
export function CreateNotePage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isLoadingTaxonomies, setIsLoadingTaxonomies] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Load curriculum taxonomies once on mount
  const loadTaxonomies = useCallback(async () => {
    setIsLoadingTaxonomies(true);
    setLoadError('');
    try {
      const [courseData, subjData, catData] = await Promise.all([
        courseService.listCourses(),
        subjectService.listSubjects(),
        categoryService.listCategories()
      ]);
      setCourses(courseData || []);
      setSubjects(subjData || []);
      setCategories(catData || []);
    } catch (err) {
      setLoadError(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to load academic curriculum subjects. Please check your connection or click retry.'
      );
    } finally {
      setIsLoadingTaxonomies(false);
    }
  }, []);

  useEffect(() => {
    loadTaxonomies();
  }, [loadTaxonomies]);

  async function handleSubmit(payload, action) {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      await noteService.createNote(payload);
      // Navigate to My Notes dashboard
      navigate('/my-notes', {
        state: {
          notice:
            action === 'publish' || action === 'submit'
              ? 'Your study note has been published immediately to the academic catalog.'
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
      <SEO title="Upload Study Note" noindex={true} />
      <Container size="md">
        <header className="notes-page__header">
          <span className="notes-page__eyebrow">Academic Desk</span>
          <h1 className="notes-page__title">Create Study Note</h1>
          <p className="notes-page__subtitle">
            Draft lecture notes or attach documents to contribute to your personal archive and the
            university study community.
          </p>
        </header>

        {loadError && (
          <div
            className="note-form__alert note-form__alert--danger"
            style={{
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}
            role="alert"
          >
            <span>{loadError}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadTaxonomies}
              disabled={isLoadingTaxonomies}
            >
              ↻ Retry Loading
            </Button>
          </div>
        )}

        <NoteForm
          courses={courses}
          subjects={subjects}
          categories={categories}
          isLoadingTaxonomies={isLoadingTaxonomies}
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
