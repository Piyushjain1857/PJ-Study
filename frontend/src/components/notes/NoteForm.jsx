import React, { useState, useEffect, useMemo } from 'react';
import FileUpload from './FileUpload.jsx';
import Button from '../common/Button.jsx';
import './NoteForm.css';

/**
 * Scholar note creation and editing form.
 */
export function NoteForm({
  initialValues = {},
  courses = [],
  subjects = [],
  categories = [],
  isLoadingTaxonomies = false,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitError = ''
}) {
  const [title, setTitle] = useState(initialValues.title || '');
  const [description, setDescription] = useState(initialValues.description || '');
  const [courseId, setCourseId] = useState(initialValues.courseId || '');
  const [semester, setSemester] = useState(
    initialValues.semester ? String(initialValues.semester) : ''
  );
  const [subjectId, setSubjectId] = useState(initialValues.subjectId || '');
  const [categoryId, setCategoryId] = useState(initialValues.categoryId || '');
  const [academicYear, setAcademicYear] = useState(initialValues.academicYear || '');
  const [content, setContent] = useState(initialValues.content || '');
  const [file, setFile] = useState(null);
  const [existingFileName, setExistingFileName] = useState(initialValues.fileName || '');

  // Field validation errors
  const [errors, setErrors] = useState({});

  // Sync initialValues if they arrive late (e.g. edit mode fetch)
  useEffect(() => {
    if (initialValues.title !== undefined) setTitle(initialValues.title || '');
    if (initialValues.description !== undefined) setDescription(initialValues.description || '');
    if (initialValues.courseId !== undefined) setCourseId(initialValues.courseId || '');
    if (initialValues.semester !== undefined) {
      setSemester(initialValues.semester ? String(initialValues.semester) : '');
    }
    if (initialValues.subjectId !== undefined) setSubjectId(initialValues.subjectId || '');
    if (initialValues.categoryId !== undefined) setCategoryId(initialValues.categoryId || '');
    if (initialValues.academicYear !== undefined) setAcademicYear(initialValues.academicYear || '');
    if (initialValues.content !== undefined) setContent(initialValues.content || '');
    if (initialValues.fileName !== undefined) setExistingFileName(initialValues.fileName || '');
  }, [initialValues]);

  // If a subject is selected or preloaded, auto-sync its courseId and semester if not manually set
  useEffect(() => {
    if (subjectId && subjects.length > 0) {
      const match = subjects.find((s) => s.id === subjectId);
      if (match) {
        if (!courseId && match.courseId) {
          setCourseId(match.courseId);
        }
        if (!semester && match.semester) {
          setSemester(String(match.semester));
        }
      }
    }
  }, [subjectId, subjects, courseId, semester]);

  // Dynamic course list preserving canonical programs priority without hardcoding
  const preferredCourseOrder = ['b.tech', 'bca', 'b.sc.', 'mca', 'm.tech'];
  const displayCourses = useMemo(() => {
    const rawList = Array.isArray(courses) ? courses : [];
    return [...rawList].sort((a, b) => {
      const idxA = preferredCourseOrder.indexOf(a.name?.toLowerCase().trim());
      const idxB = preferredCourseOrder.indexOf(b.name?.toLowerCase().trim());
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [courses]);

  // Selected Course details for dynamic semester architecture
  const selectedCourse = useMemo(() => {
    return courses.find((c) => c.id === courseId);
  }, [courses, courseId]);

  // Dynamic valid semesters derived from course semestersCount
  const validSemesters = useMemo(() => {
    if (!selectedCourse) {
      return [1, 2, 3, 4, 5, 6, 7, 8];
    }
    const maxSem =
      selectedCourse.semestersCount ||
      (/b\.?\s*tech/i.test(selectedCourse.name)
        ? 8
        : /bca|b\.?\s*sc/i.test(selectedCourse.name)
          ? 6
          : /mca|m\.?\s*tech/i.test(selectedCourse.name)
            ? 4
            : 8);
    return Array.from({ length: maxSem }, (_, i) => i + 1);
  }, [selectedCourse]);

  // In-memory filtered subjects according to selected course and/or semester
  const filteredSubjects = useMemo(() => {
    if (!Array.isArray(subjects)) return [];
    return subjects.filter((s) => {
      if (courseId && s.courseId !== courseId) return false;
      if (semester && s.semester !== parseInt(semester, 10)) return false;
      return true;
    });
  }, [subjects, courseId, semester]);

  // Handle Course selection change
  const handleCourseChange = (newCourseId) => {
    setCourseId(newCourseId);
    if (errors.subjectId) setErrors((prev) => ({ ...prev, subjectId: '' }));

    const newCourse = courses.find((c) => c.id === newCourseId);
    if (newCourse && semester) {
      const maxSem = newCourse.semestersCount || 8;
      if (parseInt(semester, 10) > maxSem) {
        setSemester('');
      }
    }

    // If currently selected subject is not in the new course, reset it
    if (subjectId) {
      const currentSubj = subjects.find((s) => s.id === subjectId);
      if (currentSubj && newCourseId && currentSubj.courseId !== newCourseId) {
        setSubjectId('');
      }
    }
  };

  // Handle Semester selection change
  const handleSemesterChange = (newSemester) => {
    setSemester(newSemester);
    if (errors.subjectId) setErrors((prev) => ({ ...prev, subjectId: '' }));

    // If currently selected subject is not in the new semester, reset it
    if (subjectId) {
      const currentSubj = subjects.find((s) => s.id === subjectId);
      if (currentSubj && newSemester && currentSubj.semester !== parseInt(newSemester, 10)) {
        setSubjectId('');
      }
    }
  };

  // Handle Subject selection change
  const handleSubjectChange = (newSubjectId) => {
    setSubjectId(newSubjectId);
    if (errors.subjectId) setErrors((prev) => ({ ...prev, subjectId: '' }));

    // Automatically sync course and semester from chosen subject
    if (newSubjectId) {
      const match = subjects.find((s) => s.id === newSubjectId);
      if (match) {
        if (!courseId && match.courseId) setCourseId(match.courseId);
        if (!semester && match.semester) setSemester(String(match.semester));
      }
    }
  };

  // Reset curriculum filters
  const handleResetFilters = () => {
    setCourseId('');
    setSemester('');
  };

  function validate() {
    const errs = {};
    if (!title.trim()) {
      errs.title = 'Manuscript title is required.';
    }
    if (!subjectId) {
      errs.subjectId = 'Please select an academic curriculum subject.';
    }

    const hasContent = content.trim().length > 0;
    const hasFile = Boolean(file) || Boolean(existingFileName);

    if (!hasContent && !hasFile) {
      errs.contentOrFile =
        'Please either write study note content or attach an educational document (PDF/Word/PPTX).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(action) {
    if (!validate()) return;

    // Build payload (FormData if file attached, otherwise plain JSON object)
    if (file) {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('subjectId', subjectId);
      if (courseId) formData.append('courseId', courseId);
      if (categoryId) formData.append('categoryId', categoryId);
      if (semester) formData.append('semester', semester);
      if (academicYear) formData.append('academicYear', academicYear.trim());
      if (content.trim()) formData.append('content', content.trim());
      formData.append('file', file);
      formData.append('action', action); // 'draft' or 'submit'
      onSubmit(formData, action);
    } else {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        subjectId,
        courseId: courseId || null,
        categoryId: categoryId || null,
        semester: semester ? parseInt(semester, 10) : null,
        academicYear: academicYear.trim() || null,
        content: content.trim() || null,
        action // 'draft' or 'submit'
      };
      onSubmit(payload, action);
    }
  }

  return (
    <form className="note-form" onSubmit={(e) => e.preventDefault()} noValidate>
      {submitError && (
        <div className="note-form__alert note-form__alert--danger" role="alert">
          {submitError}
        </div>
      )}

      {/* Title */}
      <div className="note-form__group">
        <label htmlFor="note-title" className="note-form__label">
          Manuscript Title <span className="note-form__required">*</span>
        </label>
        <input
          id="note-title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
          }}
          placeholder="e.g., Dynamic Programming & Memoization Patterns"
          className={`note-form__input ${errors.title ? 'note-form__input--error' : ''}`}
          disabled={isSubmitting}
        />
        {errors.title && <span className="note-form__error">{errors.title}</span>}
      </div>

      {/* Curriculum Filtering Controls */}
      <div className="note-form__row">
        {/* Academic Course (Program) */}
        <div className="note-form__group">
          <label htmlFor="note-course" className="note-form__label">
            Degree / Academic Course
          </label>
          <select
            id="note-course"
            value={courseId}
            onChange={(e) => handleCourseChange(e.target.value)}
            className="note-form__select"
            disabled={isSubmitting || isLoadingTaxonomies}
          >
            <option value="">All Academic Programs (Filter)</option>
            {displayCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Curriculum Semester */}
        <div className="note-form__group">
          <label htmlFor="note-semester" className="note-form__label">
            Curriculum Semester
          </label>
          <select
            id="note-semester"
            value={semester}
            onChange={(e) => handleSemesterChange(e.target.value)}
            className="note-form__select"
            disabled={isSubmitting || isLoadingTaxonomies}
          >
            <option value="">All Semesters (Filter)</option>
            {validSemesters.map((s) => (
              <option key={s} value={String(s)}>
                Semester {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Subject & Category Row */}
      <div className="note-form__row">
        {/* Academic Subject (Required) */}
        <div className="note-form__group">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label htmlFor="note-subject" className="note-form__label">
              Academic Subject <span className="note-form__required">*</span>
            </label>
            {(courseId || semester) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="note-form__filter-reset"
                title="Clear course and semester filters"
              >
                Showing {filteredSubjects.length} of {subjects.length} • Clear filters
              </button>
            )}
          </div>
          <select
            id="note-subject"
            value={subjectId}
            onChange={(e) => handleSubjectChange(e.target.value)}
            className={`note-form__select ${errors.subjectId ? 'note-form__input--error' : ''}`}
            disabled={isSubmitting || isLoadingTaxonomies}
          >
            {isLoadingTaxonomies ? (
              <option value="">Loading academic subjects...</option>
            ) : filteredSubjects.length === 0 ? (
              <option value="" disabled>
                No subjects found for selected course and semester
              </option>
            ) : (
              <option value="">Select Academic Subject...</option>
            )}
            {filteredSubjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (Semester {s.semester}
                {s.credits ? ` • ${s.credits} Credits` : ''}
                {s.course?.name ? ` • ${s.course.name}` : ''})
              </option>
            ))}
          </select>
          {errors.subjectId && <span className="note-form__error">{errors.subjectId}</span>}
          {!isLoadingTaxonomies && filteredSubjects.length === 0 && (
            <span className="note-form__empty-hint">
              No subjects match the selected course and semester combination.{' '}
              <button
                type="button"
                onClick={handleResetFilters}
                className="note-form__empty-hint-btn"
              >
                Reset filters
              </button>{' '}
              to show all subjects.
            </span>
          )}
        </div>

        {/* Study Category */}
        <div className="note-form__group">
          <label htmlFor="note-category" className="note-form__label">
            Study Material Category
          </label>
          <select
            id="note-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="note-form__select"
            disabled={isSubmitting || isLoadingTaxonomies}
          >
            <option value="">Select Category...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Academic Year */}
      <div className="note-form__group">
        <label htmlFor="note-year" className="note-form__label">
          Academic Year
        </label>
        <input
          id="note-year"
          type="text"
          value={academicYear}
          onChange={(e) => setAcademicYear(e.target.value)}
          placeholder="e.g., 2025-2026"
          className="note-form__input"
          disabled={isSubmitting}
        />
      </div>

      {/* Description / Abstract */}
      <div className="note-form__group">
        <label htmlFor="note-description" className="note-form__label">
          Summary / Abstract
        </label>
        <textarea
          id="note-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief summary of syllabus concepts and topics covered in this manuscript..."
          className="note-form__textarea"
          disabled={isSubmitting}
        />
      </div>

      {/* Content Section: File Upload or Written Notes */}
      <div className="note-form__section">
        <h4 className="note-form__section-title">Educational Manuscript Material</h4>
        <p className="note-form__section-desc">
          Attach a document file (PDF, Word, PPTX) or write formatted notes in plain text / markdown
          below.
        </p>

        {errors.contentOrFile && (
          <div
            className="note-form__alert note-form__alert--danger"
            style={{ marginBottom: '16px' }}
          >
            {errors.contentOrFile}
          </div>
        )}

        {/* File Attachment */}
        <div className="note-form__group" style={{ marginBottom: '24px' }}>
          <label className="note-form__label">
            Attach Document File (Optional if writing text below)
          </label>

          {existingFileName && !file && (
            <div className="note-form__existing-file">
              <span>
                Attached document: <strong>{existingFileName}</strong>
              </span>
              <button
                type="button"
                className="note-form__replace-btn"
                onClick={() => setExistingFileName('')}
              >
                Replace File
              </button>
            </div>
          )}

          {(!existingFileName || file) && (
            <FileUpload
              file={file}
              onFileSelect={(f) => {
                setFile(f);
                if (errors.contentOrFile) {
                  setErrors((prev) => ({ ...prev, contentOrFile: '' }));
                }
              }}
              onFileRemove={() => setFile(null)}
            />
          )}
        </div>

        {/* Written text notes editor */}
        <div className="note-form__group">
          <label htmlFor="note-content" className="note-form__label">
            Written Study Manuscript / Lecture Notes (Markdown supported)
          </label>
          <textarea
            id="note-content"
            rows={10}
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (errors.contentOrFile) {
                setErrors((prev) => ({ ...prev, contentOrFile: '' }));
              }
            }}
            placeholder="# Lecture 04: Divide & Conquer Algorithms&#10;&#10;Key Concepts:&#10;1. Divide problem into sub-problems&#10;2. Conquer recursively&#10;3. Combine solutions..."
            className="note-form__textarea note-form__textarea--code"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="note-form__actions">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>

        <div className="note-form__submit-buttons">
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleSubmit('draft')}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save as Draft'}
          </Button>

          <Button
            type="button"
            variant="primary"
            onClick={() => handleSubmit('publish')}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Publishing...' : 'Publish Note'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default NoteForm;
