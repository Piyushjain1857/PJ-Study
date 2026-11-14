import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import noteService from '../../services/noteService.js';
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
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') {
        return; // Request was aborted by newer search query
      }
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          'Unable to discover study notes. Please check your connection and retry.'
      );
    } finally {
      setIsLoading(false);
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
        {/* Page Header */}
        <header className="notes-discovery-banner">
          <span className="notes-discovery-banner__eyebrow">Academic Archives</span>
          <h1 className="notes-discovery-banner__title">Explore Study Notes</h1>
          <p className="notes-discovery-banner__subtitle">
            Find the right notes, study smarter, and prepare with confidence. Discover approved
            course syllabi, lecture notes, lab guides, and curated exam solutions.
          </p>
        </header>

        {/* Search Bar */}
        <section className="notes-discovery-toolbar" aria-label="Search and discovery controls">
          <NotesSearchBar
            value={querySearch}
            onChange={(newSearch) => updateParams({ search: newSearch })}
            totalCount={!isLoading ? (pagination.total ?? pagination.totalItems) : null}
            isLoading={isLoading}
          />

          {/* Subbar: Sort Dropdown & Grid/List View Mode */}
          <div className="notes-discovery-subbar">
            <div className="notes-discovery-subbar__left">
              <NotesSortControl
                value={querySort}
                onChange={(newSort) => updateParams({ sort: newSort })}
              />
            </div>

            <div className="notes-discovery-subbar__right">
              <NotesViewToggle
                view={queryView}
                onChange={(newView) => updateParams({ view: newView }, false)}
              />
            </div>
          </div>
        </section>

        {/* Academic Filter Panel */}
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

        {/* Download notification alert */}
        {downloadNotice && (
          <div
            className="note-form__alert note-form__alert--success"
            style={{
              marginBottom: '20px',
              backgroundColor: '#eef8f2',
              color: '#1b633b',
              border: '1px solid #bbf7d0'
            }}
            role="status"
          >
            {downloadNotice}
          </div>
        )}

        {/* Network or Server Error Banner */}
        {error && (
          <div
            className="note-form__alert note-form__alert--danger"
            style={{ marginBottom: '24px' }}
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

        {/* Notes Results: Grid vs. List */}
        {queryView === 'grid' ? (
          <NotesResultsGrid
            notes={notes}
            isLoading={isLoading}
            onDownload={handleDownload}
            emptyState={
              hasActiveFiltersOrSearch ? (
                <NotesEmptyState
                  title="No matching notes found"
                  description="Try a different keyword or adjust your semester, course, and category filters."
                  actionLabel="Clear All Filters"
                  onAction={handleClearAll}
                />
              ) : (
                <NotesEmptyState
                  title="No study notes available yet"
                  description="Approved notes will appear here when they become available. Be the first to upload and share study materials!"
                  actionLabel="Upload a Note"
                  actionTo="/notes/new"
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
                  title="No matching notes found"
                  description="Try a different keyword or adjust your semester, course, and category filters."
                  actionLabel="Clear All Filters"
                  onAction={handleClearAll}
                />
              ) : (
                <NotesEmptyState
                  title="No study notes available yet"
                  description="Approved notes will appear here when they become available."
                  actionLabel="Upload a Note"
                  actionTo="/notes/new"
                />
              )
            }
          />
        )}

        {/* Server-Side Pagination */}
        {!isLoading && (
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
