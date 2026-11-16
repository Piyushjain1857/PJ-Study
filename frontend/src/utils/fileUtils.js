/**
 * PJ Study Academic File Format & Attachment Helpers
 * Maps mime types and file extensions to human-readable metadata,
 * color tokens, clean icons, and inline preview capabilities.
 */

/**
 * Formats raw byte count into human-readable metric string.
 *
 * @param {number|string} bytes
 * @returns {string} e.g. "19.9 KB", "2.4 MB"
 */
export function formatBytes(bytes) {
  if (!bytes) return '';
  const num = Number(bytes);
  if (isNaN(num) || num <= 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(num) / Math.log(k));
  return `${parseFloat((num / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Inspects file extension and MIME type to return structured format presentation.
 *
 * @param {string} [fileName='']
 * @param {string} [mimeType='']
 * @returns {object}
 */
export function getFileFormatInfo(fileName = '', mimeType = '') {
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  const lowerMime = (mimeType || '').toLowerCase();

  // 1. PDF Documents
  if (ext === 'pdf' || lowerMime === 'application/pdf') {
    return {
      ext: 'PDF',
      label: 'PDF Document',
      friendlyType: 'Adobe Acrobat PDF',
      badgeText: 'PDF',
      appHint: 'Interactive inline document preview available',
      color: '#DC2626',
      bgColor: '#FEF2F2',
      borderColor: '#FECACA',
      iconType: 'pdf',
      canPreviewInline: true
    };
  }

  // 2. Microsoft Word Documents
  if (
    ext === 'docx' ||
    ext === 'doc' ||
    lowerMime.includes('wordprocessingml') ||
    lowerMime.includes('msword')
  ) {
    return {
      ext: ext ? ext.toUpperCase() : 'DOCX',
      label: 'Word Document',
      friendlyType: 'Microsoft Word Document',
      badgeText: 'DOCX',
      appHint: 'Open with Microsoft Word, Google Docs, or LibreOffice',
      color: '#2563EB',
      bgColor: '#EFF6FF',
      borderColor: '#BFDBFE',
      iconType: 'doc',
      canPreviewInline: false
    };
  }

  // 3. PowerPoint Presentations
  if (
    ext === 'pptx' ||
    ext === 'ppt' ||
    lowerMime.includes('presentationml') ||
    lowerMime.includes('powerpoint')
  ) {
    return {
      ext: ext ? ext.toUpperCase() : 'PPTX',
      label: 'Presentation Slide Deck',
      friendlyType: 'Microsoft PowerPoint',
      badgeText: 'PPTX',
      appHint: 'Open with PowerPoint, Google Slides, or Keynote',
      color: '#EA580C',
      bgColor: '#FFF7ED',
      borderColor: '#FFEDD5',
      iconType: 'presentation',
      canPreviewInline: false
    };
  }

  // 4. Excel Spreadsheets & CSV
  if (
    ext === 'xlsx' ||
    ext === 'xls' ||
    ext === 'csv' ||
    lowerMime.includes('spreadsheetml') ||
    lowerMime.includes('excel') ||
    lowerMime.includes('csv')
  ) {
    return {
      ext: ext ? ext.toUpperCase() : 'XLSX',
      label: 'Spreadsheet Dataset',
      friendlyType: 'Excel / CSV Workbook',
      badgeText: ext ? ext.toUpperCase() : 'XLSX',
      appHint: 'Open with Microsoft Excel, Google Sheets, or Numbers',
      color: '#059669',
      bgColor: '#ECFDF5',
      borderColor: '#A7F3D0',
      iconType: 'sheet',
      canPreviewInline: false
    };
  }

  // 5. Images
  if (
    ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(ext) ||
    lowerMime.startsWith('image/')
  ) {
    return {
      ext: ext ? ext.toUpperCase() : 'IMG',
      label: 'Visual Diagram / Image',
      friendlyType: 'High-Res Image Reference',
      badgeText: ext ? ext.toUpperCase() : 'IMG',
      appHint: 'Interactive image preview available',
      color: '#4F46E5',
      bgColor: '#EEF2FF',
      borderColor: '#C7D2FE',
      iconType: 'image',
      canPreviewInline: true
    };
  }

  // 6. Text / Markdown / Code Transcripts
  if (
    ['txt', 'md', 'markdown', 'js', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json'].includes(ext) ||
    lowerMime.startsWith('text/')
  ) {
    return {
      ext: ext ? ext.toUpperCase() : 'TXT',
      label: ext === 'md' ? 'Markdown Manuscript' : 'Plain Text Transcript',
      friendlyType: 'Academic Text Document',
      badgeText: ext ? ext.toUpperCase() : 'TXT',
      appHint: 'Interactive text manuscript available',
      color: '#0D9488',
      bgColor: '#F0FDFA',
      borderColor: '#99F6E4',
      iconType: 'text',
      canPreviewInline: true
    };
  }

  // 7. Compressed Archives
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return {
      ext: ext ? ext.toUpperCase() : 'ZIP',
      label: 'Compressed Resource Package',
      friendlyType: 'Archive Bundle',
      badgeText: 'ZIP',
      appHint: 'Extract with your local system archive manager',
      color: '#7C3AED',
      bgColor: '#F5F3FF',
      borderColor: '#DDD6FE',
      iconType: 'archive',
      canPreviewInline: false
    };
  }

  // 8. General Academic Attachment Fallback
  return {
    ext: ext ? ext.toUpperCase() : 'FILE',
    label: 'Academic Attachment',
    friendlyType: 'Study File Attachment',
    badgeText: ext ? ext.toUpperCase() : 'FILE',
    appHint: 'Download to inspect with your desktop application',
    color: '#245C46',
    bgColor: '#EDF5F0',
    borderColor: '#D7D9D3',
    iconType: 'file',
    canPreviewInline: false
  };
}
