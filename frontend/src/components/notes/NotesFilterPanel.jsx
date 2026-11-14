import React, { useMemo, useState } from 'react';
import '../../styles/notes-discovery.css';

/**
 * Academic filtering panel supporting dependent hierarchies, active filter chips,
 * and responsive mobile drawer presentation.
 */
export function NotesFilterPanel({
  courseId = '',
  onCourseChange,
  semester = '',
  onSemesterChange,
  subjectId = '',
  onSubjectChange,
  categoryId = '',
  onCategoryChange,
  courses = [],
  subjects = [],
  categories = [],
  semesters = [1, 2, 3, 4, 5, 6, 7, 8],
  onClearAll,
  _totalResults = 0
}) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // 1. Compute dependent semesters based on selected course
  const availableSemesters = useMemo(() => {
    if (!courseId) return semesters;
    const courseSubjects = subjects.filter((s) => s.courseId === courseId);
    const semSet = new Set(courseSubjects.map((s) => s.semester).filter(Boolean));
    const sorted = Array.from(semSet).sort((a, b) => a - b);
    return sorted.length > 0 ? sorted : semesters;
  }, [courseId, subjects, semesters]);

  // 2. Compute dependent subjects based on selected course and/or semester
  const availableSubjects = useMemo(() => {
    return subjects.filter((s) => {
      if (courseId && s.courseId !== courseId) return false;
      if (semester && s.semester !== Number(semester)) return false;
      return true;
    });
  }, [subjects, courseId, semester]);

  // Active filters list for chip rendering
  const activeFilters = useMemo(() => {
    const list = [];

    if (courseId) {
      const c = courses.find((item) => item.id === courseId);
      list.push({
        id: 'course',
        label: `Course: ${c?.name || 'Selected'}`,
        clear: () => {
          onCourseChange('');
          // Also reset subject if it belonged to this course
          onSubjectChange('');
        }
      });
    }

    if (semester) {
      list.push({
        id: 'semester',
        label: `Semester ${semester}`,
        clear: () => onSemesterChange('')
      });
    }

    if (subjectId) {
      const s = subjects.find((item) => item.id === subjectId);
      list.push({
        id: 'subject',
        label: `Subject: ${s?.name || 'Selected'}`,
        clear: () => onSubjectChange('')
      });
    }

    if (categoryId) {
      const cat = categories.find((item) => item.id === categoryId);
      list.push({
        id: 'category',
        label: `Category: ${cat?.name || 'Selected'}`,
        clear: () => onCategoryChange('')
      });
    }

    return list;
  }, [
    courseId,
    semester,
    subjectId,
    categoryId,
    courses,
    subjects,
    categories,
    onCourseChange,
    onSemesterChange,
    onSubjectChange,
    onCategoryChange
  ]);

  const hasActiveFilters = activeFilters.length > 0;

  function handleCourseSelect(newCourseId) {
    onCourseChange(newCourseId);
    // If the currently selected subject does not belong to the newly chosen course, clear it
    if (subjectId) {
      const currentSubject = subjects.find((s) => s.id === subjectId);
      if (currentSubject && newCourseId && currentSubject.courseId !== newCourseId) {
        onSubjectChange('');
      }
    }
  }

  function handleSemesterSelect(newSemester) {
    onSemesterChange(newSemester);
    // If the currently selected subject does not match the newly chosen semester, clear it
    if (subjectId) {
      const currentSubject = subjects.find((s) => s.id === subjectId);
      if (currentSubject && newSemester && currentSubject.semester !== Number(newSemester)) {
        onSubjectChange('');
      }
    }
  }

  return (
    <div className="notes-filter-panel-root">
      {/* Mobile Toggle Button */}
      <div className="notes-filter-panel__mobile-header">
        <button
          type="button"
          className="btn btn--outline btn--sm notes-filter-panel__mobile-toggle"
          onClick={() => setMobileDrawerOpen((prev) => !prev)}
          aria-expanded={mobileDrawerOpen}
        >
          <span>Academic Filters {hasActiveFilters ? `(${activeFilters.length})` : ''}</span>
          <span aria-hidden="true">{mobileDrawerOpen ? '▲' : '▼'}</span>
        </button>

        {hasActiveFilters && (
          <button type="button" className="notes-filter-panel__clear-all-link" onClick={onClearAll}>
            Clear All
          </button>
        )}
      </div>

      {/* Filter Controls Bar */}
      <div
        className={`notes-filter-panel__controls ${
          mobileDrawerOpen ? 'notes-filter-panel__controls--open' : ''
        }`}
      >
        {/* Course Filter */}
        <div className="notes-filter-group">
          <label htmlFor="filter-course-select" className="notes-filter-group__label">
            Course / Degree
          </label>
          <div className="notes-filter-group__select-wrapper">
            <select
              id="filter-course-select"
              value={courseId}
              onChange={(e) => handleCourseSelect(e.target.value)}
              className="notes-filter-group__select"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <span className="notes-filter-group__arrow" aria-hidden="true">
              ▾
            </span>
          </div>
        </div>

        {/* Semester Filter */}
        <div className="notes-filter-group">
          <label htmlFor="filter-semester-select" className="notes-filter-group__label">
            Semester
          </label>
          <div className="notes-filter-group__select-wrapper">
            <select
              id="filter-semester-select"
              value={semester}
              onChange={(e) => handleSemesterSelect(e.target.value)}
              className="notes-filter-group__select"
            >
              <option value="">All Semesters</option>
              {availableSemesters.map((sem) => (
                <option key={sem} value={sem}>
                  Semester {sem}
                </option>
              ))}
            </select>
            <span className="notes-filter-group__arrow" aria-hidden="true">
              ▾
            </span>
          </div>
        </div>

        {/* Subject Filter */}
        <div className="notes-filter-group">
          <label htmlFor="filter-subject-select" className="notes-filter-group__label">
            Subject
          </label>
          <div className="notes-filter-group__select-wrapper">
            <select
              id="filter-subject-select"
              value={subjectId}
              onChange={(e) => onSubjectChange(e.target.value)}
              className="notes-filter-group__select"
            >
              <option value="">All Subjects</option>
              {availableSubjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.semester ? `(Sem ${s.semester})` : ''}
                </option>
              ))}
            </select>
            <span className="notes-filter-group__arrow" aria-hidden="true">
              ▾
            </span>
          </div>
        </div>

        {/* Category Filter */}
        <div className="notes-filter-group">
          <label htmlFor="filter-category-select" className="notes-filter-group__label">
            Genre / Category
          </label>
          <div className="notes-filter-group__select-wrapper">
            <select
              id="filter-category-select"
              value={categoryId}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="notes-filter-group__select"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} {cat.noteCount ? `(${cat.noteCount})` : ''}
                </option>
              ))}
            </select>
            <span className="notes-filter-group__arrow" aria-hidden="true">
              ▾
            </span>
          </div>
        </div>

        {/* Clear action on desktop */}
        {hasActiveFilters && (
          <button
            type="button"
            className="notes-filter-panel__reset-btn"
            onClick={onClearAll}
            title="Reset all active filters"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Active Filter Chips / Pills */}
      {hasActiveFilters && (
        <div className="notes-filter-chips" aria-label="Active filters">
          <span className="notes-filter-chips__label">Active filters:</span>
          {activeFilters.map((chip) => (
            <span key={chip.id} className="notes-filter-chip">
              <span className="notes-filter-chip__text">{chip.label}</span>
              <button
                type="button"
                className="notes-filter-chip__remove"
                onClick={chip.clear}
                aria-label={`Remove filter: ${chip.label}`}
              >
                ✕
              </button>
            </span>
          ))}
          <button type="button" className="notes-filter-chips__clear-all" onClick={onClearAll}>
            Reset All
          </button>
        </div>
      )}
    </div>
  );
}

export default NotesFilterPanel;
