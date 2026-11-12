import React, { useState } from 'react';
import FileUpload from './FileUpload.jsx';
import Button from '../common/Button.jsx';
import './NoteForm.css';

/**
 * Scholar note creation and editing form.
 */
export function NoteForm({
  initialValues = {},
  subjects = [],
  categories = [],
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitError = ''
}) {
  const [title, setTitle] = useState(initialValues.title || '');
  const [description, setDescription] = useState(initialValues.description || '');
  const [subjectId, setSubjectId] = useState(initialValues.subjectId || '');
  const [categoryId, setCategoryId] = useState(initialValues.categoryId || '');
  const [semester, setSemester] = useState(initialValues.semester || '');
  const [academicYear, setAcademicYear] = useState(initialValues.academicYear || '');
  const [content, setContent] = useState(initialValues.content || '');
  const [file, setFile] = useState(null);
  const [existingFileName, setExistingFileName] = useState(initialValues.fileName || '');

  // Field validation errors
  const [errors, setErrors] = useState({});

  function validate() {
    const errs = {};
    if (!title.trim()) {
      errs.title = 'Manuscript title is required.';
    }
    if (!subjectId) {
      errs.subjectId = 'Please select an academic subject.';
    }

    const hasContent = content.trim().length > 0;
    const hasFile = Boolean(file) || Boolean(existingFileName);

    if (!hasContent && !hasFile) {
      errs.contentOrFile =
        'Please either write note content or attach a study document (PDF/Word/PPTX).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSubmit(action) {
    if (!validate()) return;

    // Build payload (FormData if file attached, otherwise plain object)
    if (file) {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('subjectId', subjectId);
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

      {/* Curriculum Taxonomy Row */}
      <div className="note-form__row">
        {/* Subject */}
        <div className="note-form__group">
          <label htmlFor="note-subject" className="note-form__label">
            Academic Subject <span className="note-form__required">*</span>
          </label>
          <select
            id="note-subject"
            value={subjectId}
            onChange={(e) => {
              setSubjectId(e.target.value);
              if (errors.subjectId) setErrors((prev) => ({ ...prev, subjectId: '' }));
            }}
            className={`note-form__select ${errors.subjectId ? 'note-form__input--error' : ''}`}
            disabled={isSubmitting}
          >
            <option value="">Select Curriculum Subject...</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (Semester {s.semester})
              </option>
            ))}
          </select>
          {errors.subjectId && <span className="note-form__error">{errors.subjectId}</span>}
        </div>

        {/* Category */}
        <div className="note-form__group">
          <label htmlFor="note-category" className="note-form__label">
            Study Material Category
          </label>
          <select
            id="note-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="note-form__select"
            disabled={isSubmitting}
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

      <div className="note-form__row">
        {/* Semester */}
        <div className="note-form__group">
          <label htmlFor="note-semester" className="note-form__label">
            Curriculum Semester
          </label>
          <select
            id="note-semester"
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="note-form__select"
            disabled={isSubmitting}
          >
            <option value="">Select Semester...</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>
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
            onClick={() => handleSubmit('submit')}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit for Review'}
          </Button>
        </div>
      </div>
    </form>
  );
}

export default NoteForm;
