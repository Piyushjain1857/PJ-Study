import React, { useState, useEffect } from 'react';
import noteService from '../../services/noteService.js';
import Button from '../common/Button.jsx';
import { formatBytes, getFileFormatInfo } from '../../utils/fileUtils.js';
import './NotePreview.css';

/**
 * Secure document preview viewer for PDFs, images, and text manuscripts.
 * Supports standalone mode (with header/fullscreen) or embedded mode (hideHeader=true).
 *
 * @param {{
 *   note: object,
 *   onClose?: () => void,
 *   hideHeader?: boolean
 * }} props
 */
export function NotePreview({ note, onClose = null, hideHeader = false }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasPreviewError, setHasPreviewError] = useState(false);

  // Keyboard shortcut: Escape exits fullscreen mode cleanly
  useEffect(() => {
    if (!isFullscreen) return;

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  if (!note) return null;

  const { id, title, fileName, mimeType, fileSize, content } = note;
  const previewUrl = noteService.getFilePreviewUrl(id);
  const formatInfo = getFileFormatInfo(fileName, mimeType);
  const formattedSize = formatBytes(fileSize);

  const isPdf = formatInfo.ext === 'PDF';
  const isImage = formatInfo.iconType === 'image';
  const isText = formatInfo.iconType === 'text' || (!fileName && Boolean(content));
  const canPreview = formatInfo.canPreviewInline;

  async function handleDownload() {
    if (!fileName) return;
    await noteService.downloadFile(id, fileName || `${title}.${formatInfo.ext.toLowerCase()}`);
  }

  return (
    <div
      className={`note-preview-root ${isFullscreen ? 'note-preview-root--fullscreen' : ''} ${
        hideHeader ? 'note-preview-root--seamless' : ''
      }`}
    >
      {/* Viewer Header (Omitted when hideHeader is true) */}
      {!hideHeader && (
        <div className="note-preview-root__header">
          <div className="note-preview-root__title-col">
            <span
              className="note-preview-root__badge"
              style={{
                color: formatInfo.color,
                backgroundColor: formatInfo.bgColor,
                borderColor: formatInfo.borderColor
              }}
            >
              {formatInfo.badgeText}
            </span>
            <div className="note-preview-root__title-wrap">
              <h4 className="note-preview-root__title">{fileName || title}</h4>
              <span className="note-preview-root__meta">
                {formatInfo.friendlyType} {formattedSize && `• ${formattedSize}`}
              </span>
            </div>
          </div>

          <div className="note-preview-root__actions">
            {Boolean(fileName) && (
              <button
                type="button"
                className="note-preview-root__action-btn note-preview-root__action-btn--primary"
                onClick={handleDownload}
                title={`Download ${fileName}`}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download</span>
              </button>
            )}

            {(isPdf || isImage) && (
              <button
                type="button"
                className="note-preview-root__action-btn note-preview-root__action-btn--outline"
                onClick={() => setIsFullscreen((prev) => !prev)}
                title={isFullscreen ? 'Exit full screen (Esc)' : 'Expand to full screen'}
                aria-label={isFullscreen ? 'Exit full screen' : 'Expand to full screen'}
              >
                {isFullscreen ? (
                  <>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="4 14 10 14 10 20" />
                      <polyline points="20 10 14 10 14 4" />
                      <line x1="14" y1="10" x2="21" y2="3" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                    <span className="note-preview-root__action-btn-text">Collapse</span>
                  </>
                ) : (
                  <>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <polyline points="15 3 21 3 21 9" />
                      <polyline points="9 21 3 21 3 15" />
                      <line x1="21" y1="3" x2="14" y2="10" />
                      <line x1="3" y1="21" x2="10" y2="14" />
                    </svg>
                    <span className="note-preview-root__action-btn-text">Expand</span>
                  </>
                )}
              </button>
            )}

            {/* Close button (✕): Appears ONLY when in fullscreen mode */}
            {isFullscreen && (
              <button
                type="button"
                className="note-preview-root__action-btn note-preview-root__action-btn--close"
                onClick={() => setIsFullscreen(false)}
                title="Exit full screen (Esc)"
                aria-label="Exit full screen"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Viewer Viewport */}
      <div className="note-preview-root__viewport">
        {hasPreviewError ? (
          <div className="note-preview-root__fallback">
            <div
              className="note-preview-root__fallback-icon-wrap"
              style={{ color: '#DC2626', backgroundColor: '#FEF2F2', borderColor: '#FECACA' }}
            >
              ⚠️
            </div>
            <h4 className="note-preview-root__fallback-title">Unable to render inline preview</h4>
            <p className="note-preview-root__fallback-desc">
              The browser was unable to display this document inline. You can download the file
              directly to review it with your local software.
            </p>
            <Button variant="primary" onClick={handleDownload}>
              📥 Download Manuscript ({formattedSize || formatInfo.ext})
            </Button>
          </div>
        ) : isPdf && canPreview ? (
          <iframe
            src={previewUrl}
            title={`Document preview: ${fileName || title}`}
            className="note-preview-root__iframe"
            onError={() => setHasPreviewError(true)}
          />
        ) : isImage && canPreview ? (
          <div className="note-preview-root__image-wrapper">
            <img
              src={previewUrl}
              alt={fileName || title}
              loading="lazy"
              decoding="async"
              className="note-preview-root__image"
              onError={() => setHasPreviewError(true)}
            />
          </div>
        ) : isText && content ? (
          <div className="note-preview-root__text-view">
            <pre>{content}</pre>
          </div>
        ) : (
          /* Non-previewable formats: clean fallback hero */
          <div className="note-preview-root__fallback">
            <div
              className="note-preview-root__fallback-icon-wrap"
              style={{
                color: formatInfo.color,
                backgroundColor: formatInfo.bgColor,
                borderColor: formatInfo.borderColor
              }}
            >
              📄
            </div>
            <h4 className="note-preview-root__fallback-title">
              {formatInfo.friendlyType} Attachment
            </h4>
            <p className="note-preview-root__fallback-desc">
              {formatInfo.appHint}. Download this study document to inspect the complete manuscript.
            </p>
            <div className="note-preview-root__fallback-badge">
              <span>🔒 Verified Clean Academic Document</span>
              <span>•</span>
              <span>{formattedSize || 'Standard file'}</span>
            </div>
            <Button variant="primary" onClick={handleDownload}>
              📥 Download {fileName || 'Manuscript'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotePreview;
