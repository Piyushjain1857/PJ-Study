import React, { useState, useEffect, useCallback } from 'react';
import noteService from '../../services/noteService.js';
import subjectService from '../../services/subjectService.js';
import categoryService from '../../services/categoryService.js';
import NoteFilters from '../../components/notes/NoteFilters.jsx';
import NotesGrid from '../../components/notes/NotesGrid.jsx';
import NotesEmptyState from '../../components/notes/NotesEmptyState.jsx';
import Container from '../../components/layout/Container.jsx';
import '../../styles/notes.css';

/**
 * Public Notes Library for browsing and discovering peer-reviewed study materials.
 */
export function NotesLibraryPage() {
  const [notes, setNotes] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    totalItems: 0,
    totalPages: 1
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Taxonomies for filters
  const [subjects, setSubjects] = useState([]);
  const [categories, setCategories] = useState([]);

  // Active filter state
  const [search, setSearch] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [semester, setSemester] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Load subjects and categories on mount
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
        // Non-blocking taxonomy load
      }
    }
    loadTaxonomies();
  }, []);

  // Fetch approved notes from backend
  const fetchNotes = useCallback(
    async (pageToLoad = 1) => {
      setIsLoading(true);
      setError('');
      try {
        const res = await noteService.listNotes({
          page: pageToLoad,
          limit: 12,
          search: search.trim() || undefined,
          subjectId: subjectId || undefined,
          categoryId: categoryId || undefined,
          semester: semester || undefined,
          sortBy
        });

        const items = res?.items || res?.data || [];
        const meta = res?.meta ||
          res?.pagination || {
            page: pageToLoad,
            limit: 12,
            totalItems: items.length,
            totalPages: 1
          };

        setNotes(items);
        setPagination(meta);
      } catch (err) {
        setError(err.message || 'Unable to load study notes from academic library.');
      } finally {
        setIsLoading(false);
      }
    },
    [search, subjectId, categoryId, semester, sortBy]
  );

  useEffect(() => {
    fetchNotes(1);
  }, [fetchNotes]);

  function handleResetFilters() {
    setSearch('');
    setSubjectId('');
    setCategoryId('');
    setSemester('');
    setSortBy('newest');
  }

  return (
    <div className="notes-page">
      <Container>
        {/* Header */}
        <header className="notes-page__header">
          <span className="notes-page__eyebrow">Academic Archives</span>
          <h1 className="notes-page__title">Curated Notes Library</h1>
          <p className="notes-page__subtitle">
            Explore approved lecture notes, exam preparation guides, formula sheets, and lab manuals
            verified by academic moderators.
          </p>
        </header>

        {/* Filter Bar */}
        <NoteFilters
          search={search}
          onSearchChange={setSearch}
          subjectId={subjectId}
          onSubjectChange={setSubjectId}
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          semester={semester}
          onSemesterChange={setSemester}
          sortBy={sortBy}
          onSortChange={setSortBy}
          subjects={subjects}
          categories={categories}
          onReset={handleResetFilters}
        />

        {error && (
          <div
            className="note-form__alert note-form__alert--danger"
            style={{ marginBottom: '24px' }}
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Notes Grid */}
        <NotesGrid
          notes={notes}
          isLoading={isLoading}
          emptyState={
            <NotesEmptyState
              title="No Study Notes Found"
              description="No approved notes match your selected criteria. Try adjusting your search keywords, semester, or category filters."
              actionLabel="Upload a Note"
              actionTo="/notes/new"
            />
          }
        />

        {/* Pagination */}
        {!isLoading && pagination.totalPages > 1 && (
          <div className="notes-pagination">
            <button
              type="button"
              className="notes-pagination__btn"
              disabled={pagination.page <= 1}
              onClick={() => fetchNotes(pagination.page - 1)}
            >
              Previous
            </button>
            <span className="notes-pagination__info">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              type="button"
              className="notes-pagination__btn"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchNotes(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        )}
      </Container>
    </div>
  );
}

export default NotesLibraryPage;
