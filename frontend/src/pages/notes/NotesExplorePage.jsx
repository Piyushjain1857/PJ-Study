import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import noteService from '../../services/noteService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { PERMISSIONS } from '../../utils/permissions.js';
import Container from '../../components/layout/Container.jsx';
import NotesSearchBar from '../../components/notes/NotesSearchBar.jsx';
import NotesFilterPanel from '../../components/notes/NotesFilterPanel.jsx';
import NotesSortControl from '../../components/notes/NotesSortControl.jsx';
import NotesViewToggle from '../../components/notes/NotesViewToggle.jsx';
import NotesResultsGrid from '../../components/notes/NotesResultsGrid.jsx';
import NotesResultsList from '../../components/notes/NotesResultsList.jsx';
import NotesPagination from '../../components/notes/NotesPagination.jsx';
import NotesEmptyState from '../../components/notes/NotesEmptyState.jsx';
import '../../styles/notes-discovery.css';
import '../../styles/notes.css';

/**
 * Advanced Notes Discovery and Exploration experience.
 * Features server-side search, multi-taxonomy academic filtering, deterministic sorting,
 * URL query persistence, and dual Grid/List presentation modes.
 */
export function NotesExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, hasPermission } = useAuth();

  // User permission check for uploading
  const canUpload = isAuthenticated && hasPermission(PERMISSIONS.NOTES_CREATE);

  // Read URL query state with safe defaults
  const querySearch = searchParams.get('search') || '';
  const queryCourseId = searchParams.get('courseId') || '';
  const querySemester = searchParams.get('semester') || '';
  const querySubjectId = searchParams.get('subjectId') || '';
  const queryCategoryId = searchParams.get('categoryId') || '';
  const querySort = searchParams.get('sort') || 'newest';
  const queryPage = Math.max(parseInt(searchParams.get('page') || '1', 10), 1);
  const queryView = searchParams.get('view') === 'list' ? 'list' : 'grid';

  // Component state
  const [notes, setNotes] = useState([]);
  const [pagination, setPagination] = useState({
    page: queryPage,
    limit: 12,
    total: 0,
    totalPages: 1
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadNotice, setDownloadNotice] = useState('');

  // Taxonomies for academic filters
  const [taxonomies, setTaxonomies] = useState({
    courses: [],
    categories: [],
    subjects: [],
    semesters: [1, 2, 3, 4, 5, 6, 7, 8],
    totalApprovedNotes: 0
  });

  // Reference to abort in-flight queries
  const abortControllerRef = useRef(null);

  // 1. Load academic taxonomy filters on mount
  useEffect(() => {
    let isMounted = true;
    async function loadFilters() {
      try {
        const filters = await noteService.getExploreFilters();
        if (isMounted && filters) {
          setTaxonomies(filters);
        }
      } catch {
        // Non-blocking fallback
      }
    }
    loadFilters();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch notes whenever query parameters change
  const fetchNotes = useCallback(async () => {
    // Abort previous in-flight request if user quickly changed input/filter
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError('');

    try {
      const data = await noteService.exploreNotes(
        {
          page: queryPage,
          limit: 12,
          search: querySearch.trim() || undefined,
          courseId: queryCourseId || undefined,
          semester: querySemester || undefined,
          subjectId: querySubjectId || undefined,
          categoryId: queryCategoryId || undefined,
          sort: querySort
        },
        controller.signal
      );

      // Verify this controller is still the active one before setting state
      if (abortControllerRef.current !== controller) {
        return;
      }

      const items = data?.notes || data?.items || [];
      const meta = data?.pagination ||
        data?.meta || {
          page: queryPage,
          limit: 12,
          total: items.length,
          totalPages: 1
        };

      setNotes(items);
      setPagination(meta);
      setError('');
    } catch (err) {
      // Check for all forms of aborted or canceled requests
      const isCanceled =
        err?.isCanceled ||
        err?.name === 'CanceledError' ||
        err?.name === 'AbortError' ||
        err?.code === 'ERR_CANCELED' ||
        err?.message === 'canceled' ||
        err?.message === 'Request canceled' ||
        abortControllerRef.current !== controller;

      if (isCanceled) {
        return; // Silently ignore cancellation from newer query or unmount
      }

      setError(
        err?.response?.data?.error?.message ||
          err?.message ||
          'Unable to discover study notes. Please check your connection and retry.'
      );
    } finally {
      // Only reset loading if this request was not superseded by a newer one
      if (abortControllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  }, [
    queryPage,
    querySearch,
    queryCourseId,
    querySemester,
    querySubjectId,
    queryCategoryId,
    querySort
  ]);

  useEffect(() => {
    fetchNotes();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchNotes]);

  // Helper to update specific search params while maintaining remaining values
  const updateParams = useCallback(
    (newParams, resetPage = true) => {
      setSearchParams(
        (prev) => {
          const updated = new URLSearchParams(prev);

          Object.entries(newParams).forEach(([key, val]) => {
            if (val === undefined || val === null || val === '') {
              updated.delete(key);
            } else {
              updated.set(key, String(val));
            }
          });

          if (resetPage) {
            updated.set('page', '1');
          }

          return updated;
        },
        { replace: false }
      );
    },
    [setSearchParams]
  );

  // Clear all active filters and search queries
  const handleClearAll = useCallback(() => {
    setSearchParams((prev) => {
      const updated = new URLSearchParams();
      // Retain preferred view mode when resetting filters
      const currentView = prev.get('view');
      if (currentView) {
        updated.set('view', currentView);
      }
      return updated;
    });
  }, [setSearchParams]);

  // Handle direct file download
  async function handleDownload(note) {
    if (!note?.fileName) return;
    setDownloadNotice(`Downloading "${note.fileName}"...`);
    try {
      await noteService.downloadFile(note.id, note.fileName);
      setDownloadNotice(`✓ Successfully downloaded "${note.fileName}".`);
      setTimeout(() => setDownloadNotice(''), 4000);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          'Failed to download the study document.'
      );
      setDownloadNotice('');
    }
  }

  // Determine whether any filtering is currently active
  const hasActiveFiltersOrSearch = Boolean(
    querySearch ||
    queryCourseId ||
    querySemester ||
    querySubjectId ||
    queryCategoryId ||
    querySort !== 'newest'
  );

  return (
    <div className="notes-discovery-page">
      <Container>
        {/* 1. Compact Page Header */}
        <header className="notes-discovery-header">
          <span className="notes-discovery-header__eyebrow">Academic Library</span>
          <h1 className="notes-discovery-header__title">Explore Notes</h1>
          <p className="notes-discovery-header__subtitle">
            Find notes, guides, and study resources for your academic journey.
          </p>
        </header>

        {/* 2. Prominent Search Bar */}
        <section className="notes-discovery-search" aria-label="Search study notes">
          <NotesSearchBar
            value={querySearch}
            onChange={(newSearch) => updateParams({ search: newSearch })}
            placeholder="Search notes, subjects, topics..."
          />
        </section>

        {/* 3. Compact Academic Filter Panel (4 Columns on Desktop) */}
        <NotesFilterPanel
          courseId={queryCourseId}
          onCourseChange={(cId) => updateParams({ courseId: cId })}
          semester={querySemester}
          onSemesterChange={(sem) => updateParams({ semester: sem })}
          subjectId={querySubjectId}
          onSubjectChange={(sId) => updateParams({ subjectId: sId })}
          categoryId={queryCategoryId}
          onCategoryChange={(catId) => updateParams({ categoryId: catId })}
          courses={taxonomies.courses}
          subjects={taxonomies.subjects}
          categories={taxonomies.categories}
          semesters={taxonomies.semesters}
          onClearAll={handleClearAll}
          totalResults={pagination.total ?? pagination.totalItems}
        />

        {/* 4. Results Toolbar (Single clean bar below the filters) */}
        <div className="notes-results-toolbar" role="region" aria-label="Search results controls">
          <div className="notes-results-toolbar__left" aria-live="polite">
            {isLoading ? (
              <span className="notes-results-toolbar__count notes-results-toolbar__count--loading">
                Searching academic notes...
              </span>
            ) : (
              <span className="notes-results-toolbar__count">
                <strong className="notes-results-toolbar__count-num">
                  {pagination.total ?? pagination.totalItems ?? 0}
                </strong>{' '}
                {(pagination.total ?? pagination.totalItems ?? 0) === 1
                  ? 'study note found'
                  : 'study notes found'}
              </span>
            )}
          </div>

          <div className="notes-results-toolbar__right">
            <NotesSortControl
              value={querySort}
              onChange={(newSort) => updateParams({ sort: newSort })}
            />
            <NotesViewToggle
              view={queryView}
              onChange={(newView) => updateParams({ view: newView }, false)}
            />
          </div>
        </div>

        {/* Download notification alert */}
        {downloadNotice && (
          <div
            className="note-form__alert note-form__alert--success"
            style={{
              marginBottom: '16px',
              backgroundColor: 'var(--color-success-subtle)',
              color: 'var(--color-success)',
              border: '1px solid var(--color-success-border)'
            }}
            role="status"
          >
            {downloadNotice}
          </div>
        )}

        {/* Genuine Network or Server Error Banner (Not shown for canceled requests) */}
        {error && (
          <div
            className="note-form__alert note-form__alert--danger"
            style={{ marginBottom: '20px' }}
            role="alert"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={fetchNotes}
              className="btn btn--outline btn--sm"
              style={{ marginLeft: '12px' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* 5. Notes Results: Grid vs. List or Contextual Empty State */}
        {!error &&
          (queryView === 'grid' ? (
            <NotesResultsGrid
              notes={notes}
              isLoading={isLoading}
              onDownload={handleDownload}
              emptyState={
                hasActiveFiltersOrSearch ? (
                  <NotesEmptyState
                    title="No matching study notes found"
                    description="We couldn't find any notes matching your criteria. Try adjusting your keyword or clearing active filters."
                    actionLabel="Clear All Filters"
                    onAction={handleClearAll}
                  />
                ) : (
                  <NotesEmptyState
                    title="No study notes available yet"
                    description="Approved study resources will appear here when available."
                    actionLabel={canUpload ? 'Upload a Note' : null}
                    actionTo={canUpload ? '/notes/new' : null}
                  />
                )
              }
            />
          ) : (
            <NotesResultsList
              notes={notes}
              isLoading={isLoading}
              onDownload={handleDownload}
              emptyState={
                hasActiveFiltersOrSearch ? (
                  <NotesEmptyState
                    title="No matching study notes found"
                    description="We couldn't find any notes matching your criteria. Try adjusting your keyword or clearing active filters."
                    actionLabel="Clear All Filters"
                    onAction={handleClearAll}
                  />
                ) : (
                  <NotesEmptyState
                    title="No study notes available yet"
                    description="Approved study resources will appear here when available."
                    actionLabel={canUpload ? 'Upload a Note' : null}
                    actionTo={canUpload ? '/notes/new' : null}
                  />
                )
              }
            />
          ))}

        {/* 6. Server-Side Pagination */}
        {!isLoading && !error && (pagination.totalPages > 1 || notes.length > 0) && (
          <NotesPagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.total ?? pagination.totalItems}
            limit={pagination.limit}
            onPageChange={(newPage) => updateParams({ page: newPage }, false)}
          />
        )}
      </Container>
    </div>
  );
}

export default NotesExplorePage;
