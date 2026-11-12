import React, { useRef, useState } from 'react';
import './FileUpload.css';

const ALLOWED_EXTENSIONS = [
  '.pdf',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.txt',
  '.md',
  '.png',
  '.jpg',
  '.jpeg'
];

const MAX_BYTES = 25 * 1024 * 1024; // 25MB

export function FileUpload({ file, onFileSelect, onFileRemove, error }) {
  const [isDragging, setIsDragging] = useState(false);
  const [internalError, setInternalError] = useState('');
  const inputRef = useRef(null);

  function validateAndSet(selectedFile) {
    setInternalError('');
    if (!selectedFile) return;

    const ext = selectedFile.name.slice(((selectedFile.name.lastIndexOf('.') - 1) >>> 0) + 2);
    const normalizedExt = `.${ext.toLowerCase()}`;

    if (!ALLOWED_EXTENSIONS.includes(normalizedExt)) {
      setInternalError(
        `File type "${normalizedExt}" is not supported. Please upload a PDF, DOCX, PPTX, or text manuscript.`
      );
      return;
    }

    if (selectedFile.size > MAX_BYTES) {
      setInternalError(
        `File size (${(selectedFile.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowed limit of 25MB.`
      );
      return;
    }

    if (selectedFile.size === 0) {
      setInternalError('Selected file is empty (0 bytes).');
      return;
    }

    onFileSelect(selectedFile);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSet(e.dataTransfer.files[0]);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function formatBytes(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  const activeError = error || internalError;

  return (
    <div className="file-upload-wrapper">
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_EXTENSIONS.join(',')}
        className="file-upload-input"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            validateAndSet(e.target.files[0]);
          }
        }}
      />

      {!file ? (
        <div
          className={`file-upload-zone ${
            isDragging ? 'file-upload-zone--dragging' : ''
          } ${activeError ? 'file-upload-zone--error' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              inputRef.current?.click();
            }
          }}
          aria-label="Upload academic note document"
        >
          <div className="file-upload-zone__icon" aria-hidden="true">
            📄
          </div>
          <div className="file-upload-zone__text">
            <span className="file-upload-zone__prompt">
              Choose an academic manuscript or drag and drop
            </span>
            <span className="file-upload-zone__sub">
              PDF, Word (DOCX), PowerPoint (PPTX), Markdown, or Text up to 25MB
            </span>
          </div>
        </div>
      ) : (
        <div className="file-upload-selected">
          <div className="file-upload-selected__icon" aria-hidden="true">
            📎
          </div>
          <div className="file-upload-selected__info">
            <span className="file-upload-selected__name">{file.name}</span>
            <span className="file-upload-selected__size">{formatBytes(file.size)}</span>
          </div>
          <button
            type="button"
            className="file-upload-selected__remove"
            onClick={(e) => {
              e.stopPropagation();
              if (inputRef.current) inputRef.current.value = '';
              onFileRemove();
            }}
            aria-label="Remove attached file"
          >
            ✕
          </button>
        </div>
      )}

      {activeError && (
        <div className="file-upload-error" role="alert">
          {activeError}
        </div>
      )}
    </div>
  );
}

export default FileUpload;
