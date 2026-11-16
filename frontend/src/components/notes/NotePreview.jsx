import React, { useState } from 'react';
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
