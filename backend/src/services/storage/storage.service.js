import path from 'path';
import env from '../../config/env.js';
import { localStorageProvider, LocalStorageProvider } from './local.provider.js';
import { googleDriveProvider, GoogleDriveStorageProvider } from './googleDrive.provider.js';

/**
 * Supported educational document formats and their standard MIME types.
 */
export const ALLOWED_DOCUMENT_TYPES = Object.freeze({
  pdf: {
    extension: '.pdf',
    mimeType: 'application/pdf',
    label: 'PDF Document'
  },
  doc: {
    extension: '.doc',
    mimeType: 'application/msword',
    label: 'Microsoft Word (97-2003)'
  },
  docx: {
    extension: '.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    label: 'Microsoft Word'
  },
  ppt: {
    extension: '.ppt',
    mimeType: 'application/vnd.ms-powerpoint',
    label: 'Microsoft PowerPoint (97-2003)'
  },
  pptx: {
    extension: '.pptx',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    label: 'Microsoft PowerPoint'
  },
  txt: {
    extension: '.txt',
    mimeType: 'text/plain',
    label: 'Plain Text'
  },
  md: {
    extension: '.md',
    mimeType: 'text/markdown',
    label: 'Markdown Manuscript'
  },
  png: {
    extension: '.png',
    mimeType: 'image/png',
    label: 'PNG Image'
  },
  jpg: {
    extension: '.jpg',
    mimeType: 'image/jpeg',
    label: 'JPEG Image'
  },
  jpeg: {
    extension: '.jpeg',
    mimeType: 'image/jpeg',
    label: 'JPEG Image'
  }
});

/**
 * Dangerous executable and script file extensions strictly forbidden on PJ Study.
 */
export const FORBIDDEN_EXTENSIONS = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.php',
  '.js',
  '.mjs',
  '.ts',
  '.html',
  '.htm',
  '.vbs',
  '.ps1',
  '.jar',
  '.bin',
  '.dll',
  '.so',
  '.cgi',
  '.py',
  '.rb'
]);

/**
 * Validates document buffer magic bytes against expected file signature.
 *
 * @param {Buffer} buffer
 * @param {string} ext
 * @returns {boolean}
 */
export function validateFileSignature(buffer, ext) {
  if (!buffer || buffer.length < 4) {
    return false;
  }

  const normalizedExt = ext.toLowerCase();

  switch (normalizedExt) {
    case '.pdf':
      // %PDF-
      return buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;

    case '.docx':
    case '.pptx':
      // PK.. (ZIP archive header)
      return buffer[0] === 0x50 && buffer[1] === 0x4b;

    case '.doc':
    case '.ppt':
      // OLE2 Compound Document header (D0 CF 11 E0) or standard
      return (
        (buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0) ||
        (buffer[0] === 0x50 && buffer[1] === 0x4b)
      );

    case '.png':
      // \x89PNG
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;

    case '.jpg':
    case '.jpeg':
      // \xFF\xD8\xFF
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

    case '.txt':
    case '.md':
      // Text files must not contain executable ELF/PE/null-byte bombs
      return !buffer.slice(0, 32).includes(0x00);

    default:
      return true;
  }
}

/**
 * Unified Storage Service Facade.
 * Routes uploads, downloads, streaming previews, and deletions to either
 * Google Drive (production private cloud) or Local Storage (development/fallback/legacy).
 */
export class StorageService {
  constructor(local = localStorageProvider, drive = googleDriveProvider) {
    this.local = local;
    this.drive = drive;
  }

  /**
   * Identifies the current active storage provider for new uploads.
   *
   * @returns {'google_drive' | 'local'}
   */
  getActiveProvider() {
    if (env.storageProvider === 'google_drive') {
      if (this.drive.isConfigured()) {
        return 'google_drive';
      }
      // eslint-disable-next-line no-console
      console.warn(
        '⚠️ [StorageService] STORAGE_PROVIDER is set to "google_drive" but Google OAuth credentials are not fully configured. ' +
        'Falling back to local disk storage.'
      );
      return 'local';
    }
    return 'local';
  }

  /**
   * Validates document and routes save operation to active storage provider.
   *
   * @param {{
   *   buffer: Buffer,
   *   originalname: string,
   *   mimetype?: string,
   *   size?: number
   * }} file
   * @param {object} [academicMetadata] Academic context for Drive folder organization
   * @returns {Promise<{
   *   storageKey: string,
   *   fileName: string,
   *   fileSize: bigint,
   *   mimeType: string,
   *   storageProvider: string
   * }>}
   */
  async saveFile(file, academicMetadata = {}) {
    if (!file || !file.buffer) {
      const error = new Error('No valid file payload received.');
      error.statusCode = 400;
      error.code = 'FILE_EMPTY';
      throw error;
    }

    const originalName = path.basename(file.originalname || 'document.pdf');
    const ext = path.extname(originalName).toLowerCase();

    // 1. Extension validation & blacklist check
    if (FORBIDDEN_EXTENSIONS.has(ext)) {
      const error = new Error(
        `Executable and script formats (${ext}) are prohibited for security.`
      );
      error.statusCode = 400;
      error.code = 'FILE_TYPE_PROHIBITED';
      throw error;
    }

    const allowedFormatKey = ext.replace('.', '');
    if (!ALLOWED_DOCUMENT_TYPES[allowedFormatKey]) {
      const error = new Error(
        `Unsupported file format "${ext}". Supported types: PDF, Word (DOC/DOCX), PowerPoint (PPT/PPTX), Text, Images.`
      );
      error.statusCode = 400;
      error.code = 'UNSUPPORTED_FILE_FORMAT';
      throw error;
    }

    // 2. File size validation against env limit
    const maxBytes = env.maxFileSizeMb * 1024 * 1024;
    if (file.buffer.length > maxBytes) {
      const error = new Error(
        `File size (${(file.buffer.length / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowed limit of ${env.maxFileSizeMb}MB.`
      );
      error.statusCode = 400;
      error.code = 'FILE_TOO_LARGE';
      throw error;
    }

    if (file.buffer.length === 0) {
      const error = new Error('Uploaded file is empty (0 bytes).');
      error.statusCode = 400;
      error.code = 'FILE_EMPTY';
      throw error;
    }

    // 3. File signature verification (anti-spoofing)
    if (!validateFileSignature(file.buffer, ext)) {
      const error = new Error(
        `File content does not match expected format for "${ext}". Possible file corruption or spoofing.`
      );
      error.statusCode = 400;
      error.code = 'FILE_SIGNATURE_MISMATCH';
      throw error;
    }

    const detectedMime =
      file.mimetype ||
      ALLOWED_DOCUMENT_TYPES[allowedFormatKey]?.mimeType ||
      'application/octet-stream';

    // 4. Dispatch to provider
    const activeProvider = this.getActiveProvider();
    if (activeProvider === 'google_drive') {
      return this.drive.saveFile(file, ext, detectedMime, academicMetadata);
    }

    return this.local.saveFile(file, ext, detectedMime);
  }

  /**
   * Retrieves readable stream for downloading or previewing a file from its provider.
   *
   * @param {string} storageKey
   * @param {string} [provider='local'] 'google_drive' | 'local'
   * @param {{ start?: number, end?: number }} [rangeOptions]
   * @returns {Promise<{
   *   stream: import('stream').Readable,
   *   size: number,
   *   totalSize?: number,
   *   isRange?: boolean,
   *   start?: number,
   *   end?: number,
   *   mimeType?: string
   * }>}
   */
  async getFileStream(storageKey, provider = 'local', rangeOptions = null) {
    if (!storageKey) {
      const error = new Error('Storage key identifier is required.');
      error.statusCode = 400;
      throw error;
    }

    if (provider === 'google_drive') {
      try {
        return await this.drive.getFileStream(storageKey, rangeOptions);
      } catch (err) {
        // Fallback to local if file exists locally
        if (this.local.fileExists(storageKey)) {
          return this.local.getFileStream(storageKey, rangeOptions);
        }
        throw err;
      }
    }

    // Default to local, with fallback to Google Drive if Drive is configured
    try {
      return await this.local.getFileStream(storageKey, rangeOptions);
    } catch (err) {
      if (this.drive.isConfigured()) {
        try {
          return await this.drive.getFileStream(storageKey, rangeOptions);
        } catch {
          throw err;
        }
      }
      throw err;
    }
  }

  /**
   * Checks if stored file exists.
   *
   * @param {string} storageKey
   * @param {string|null} [provider=null]
   * @returns {Promise<boolean>}
   */
  async fileExists(storageKey, provider = null) {
    if (!storageKey) return false;
    const targetProvider = provider || this.getActiveProvider();
    if (targetProvider === 'google_drive') {
      try {
        await this.drive.getFileMetadata(storageKey);
        return true;
      } catch {
        return this.local.fileExists(storageKey);
      }
    }
    return this.local.fileExists(storageKey);
  }

  /**
   * Resolves safe local path for local storage backward compatibility.
   *
   * @param {string} storageKey
   * @returns {string} Safe absolute path
   */
  resolveSafePath(storageKey) {
    return this.local.resolveSafePath(storageKey);
  }

  /**
   * Deletes a file from its designated storage provider.
   *
   * @param {string} storageKey
   * @param {string|null} [provider=null]
   * @returns {Promise<boolean>}
   */
  async deleteFile(storageKey, provider = null) {
    if (!storageKey) return false;
    const targetProvider = provider || this.getActiveProvider();
    if (targetProvider === 'google_drive') {
      const deleted = await this.drive.deleteFile(storageKey);
      if (deleted) return true;
      return this.local.deleteFile(storageKey);
    }
    return this.local.deleteFile(storageKey);
  }

  /**
   * Checks overall storage health.
   */
  async checkHealth() {
    const activeProvider = this.getActiveProvider();
    if (activeProvider === 'google_drive') {
      return this.drive.checkHealth();
    }
    return this.local.checkHealth();
  }
}

export const storageService = new StorageService();
export default storageService;
