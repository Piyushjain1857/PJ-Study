import React, { useState } from 'react';
import noteService from '../../services/noteService.js';
import Button from '../common/Button.jsx';
import '../../styles/notes-discovery.css';

/**
 * Secure document preview viewer for PDFs, images, and text manuscripts.
 */
export function NotePreview({ note, onClose = null }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasPreviewError, setHasPreviewError] = useState(false);

  if (!note) return null;

  const { id, title, fileName, mimeType, fileSize, content } = note;
  const previewUrl = noteService.getFilePreviewUrl(id);
  const isPdf = mimeType === 'application/pdf' || (fileName && fileName.endsWith('.pdf'));
  const isImage =
    mimeType?.startsWith('image/') || (fileName && /\.(png|jpe?g|webp|gif)$/i.test(fileName));
  const isText =
    mimeType === 'text/plain' || mimeType === 'text/markdown' || (!fileName && Boolean(content));

  function formatBytes(bytes) {
    if (!bytes) return '';
    const num = Number(bytes);
    if (isNaN(num) || num <= 0) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(num) / Math.log(k));
    return `${parseFloat((num / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }

  const formattedSize = formatBytes(fileSize);

  async function handleDownload() {
    await noteService.downloadFile(id, fileName || `${title}.pdf`);
  }

  return (
    <div className={`note-preview-root ${isFullscreen ? 'note-preview-root--fullscreen' : ''}`}>
      {/* Viewer Header */}
      <div className="note-preview-root__header">
        <div className="note-preview-root__title-col">
          <span className="note-preview-root__doc-icon">📑</span>
          <div>
            <h4 className="note-preview-root__title">{fileName || title}</h4>
            <span className="note-preview-root__meta">
              {mimeType || 'Document'} {formattedSize && `• ${formattedSize}`}
            </span>
          </div>
        </div>

        <div className="note-preview-root__actions">
          <Button variant="primary" size="sm" onClick={handleDownload}>
            📥 Download File
          </Button>

          {(isPdf || isImage) && (
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => setIsFullscreen((prev) => !prev)}
              title={isFullscreen ? 'Exit full screen' : 'Expand full screen'}
              aria-label={isFullscreen ? 'Exit full screen' : 'Expand full screen'}
            >
              {isFullscreen ? '⤓ Collapse' : '⤢ Expand'}
            </button>
          )}

          {onClose && (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={onClose}
              aria-label="Close preview"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Viewer Body */}
      <div className="note-preview-root__viewport">
        {hasPreviewError ? (
          <div className="note-preview-root__fallback">
            <span className="note-preview-root__fallback-icon">⚠️</span>
            <h4>Unable to render inline preview</h4>
            <p>Please download the document directly to view it on your device.</p>
            <Button variant="primary" onClick={handleDownload} style={{ marginTop: '16px' }}>
              Download Now
            </Button>
          </div>
        ) : isPdf ? (
          <iframe
            src={previewUrl}
            title={`Document preview: ${fileName || title}`}
            className="note-preview-root__iframe"
            onError={() => setHasPreviewError(true)}
          />
        ) : isImage ? (
          <div className="note-preview-root__image-wrapper">
            <img
              src={previewUrl}
              alt={fileName || title}
              className="note-preview-root__image"
              onError={() => setHasPreviewError(true)}
            />
          </div>
        ) : isText && content ? (
          <div className="note-preview-root__text-view">
            <pre>{content}</pre>
          </div>
        ) : (
          <div className="note-preview-root__fallback">
            <span className="note-preview-root__fallback-icon">📄</span>
            <h4>Inline preview not available for this format</h4>
            <p>
              This study document ({fileName?.split('.').pop()?.toUpperCase() || 'format'}) is safe
              to download and open in your local academic application.
            </p>
            <Button variant="primary" onClick={handleDownload} style={{ marginTop: '16px' }}>
              📥 Download {fileName || 'Document'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotePreview;
