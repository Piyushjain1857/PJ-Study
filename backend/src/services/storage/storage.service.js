import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import env from '../../config/env.js';

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
const FORBIDDEN_EXTENSIONS = new Set([
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
 * Storage service abstraction supporting local filesystem and cloud providers.
 */
export class StorageService {
  constructor(baseDir = env.uploadDir) {
    this.baseDir = path.resolve(baseDir);
    this.ensureBaseDirectory();
  }

  /**
   * Guarantees that the base upload directory exists on disk.
   */
  ensureBaseDirectory() {
    try {
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`Failed to create upload directory at ${this.baseDir}:`, err.message);
    }
  }

  /**
   * Validates and saves an uploaded file buffer to secure storage.
   *
   * @param {{
   *   buffer: Buffer,
   *   originalname: string,
   *   mimetype?: string,
   *   size?: number
   * }} file
   * @returns {Promise<{
   *   storageKey: string,
   *   fileName: string,
   *   fileSize: bigint,
   *   mimeType: string
   * }>}
   */
  async saveFile(file) {
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

    // 4. Generate cryptographically random, safe storage key (prevents path traversal)
    const randomHash = crypto.randomBytes(16).toString('hex');
    const storageKey = `${Date.now()}-${randomHash}${ext}`;
    const destinationPath = path.join(this.baseDir, storageKey);

    await fs.promises.writeFile(destinationPath, file.buffer);

    const detectedMime =
      file.mimetype ||
      ALLOWED_DOCUMENT_TYPES[allowedFormatKey]?.mimeType ||
      'application/octet-stream';

    return {
      storageKey,
      fileName: originalName,
      fileSize: BigInt(file.buffer.length),
      mimeType: detectedMime
    };
  }

  /**
   * Resolves safe local path for a storage key, preventing path traversal attacks.
   *
   * @param {string} storageKey
   * @returns {string} Safe absolute path
   */
  resolveSafePath(storageKey) {
    if (!storageKey || typeof storageKey !== 'string') {
      const error = new Error('Invalid storage key identifier.');
      error.statusCode = 400;
      throw error;
    }

    // Strip any path traversal characters (e.g. ../ or /)
    const safeBaseName = path.basename(storageKey);
    const resolved = path.join(this.baseDir, safeBaseName);

    // Verify resolved path stays strictly inside this.baseDir
    if (
      !resolved.startsWith(this.baseDir) ||
      resolved.includes('..') ||
      safeBaseName !== storageKey
    ) {
      const error = new Error('Malicious path traversal detected.');
      error.statusCode = 403;
      error.code = 'INVALID_STORAGE_PATH';
      throw error;
    }

    return resolved;
  }

  /**
   * Checks if stored file exists.
   *
   * @param {string} storageKey
   * @returns {Promise<boolean>}
   */
  async fileExists(storageKey) {
    try {
      const filePath = this.resolveSafePath(storageKey);
      await fs.promises.access(filePath, fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Retrieves readable stream for downloading or previewing a file.
   *
   * @param {string} storageKey
   * @returns {Promise<{ stream: fs.ReadStream, size: number }>}
   */
  async getFileStream(storageKey) {
    const filePath = this.resolveSafePath(storageKey);
    try {
      const stat = await fs.promises.stat(filePath);
      const stream = fs.createReadStream(filePath);
      return { stream, size: stat.size };
    } catch {
      const error = new Error('Stored study material file was not found.');
      error.statusCode = 404;
      error.code = 'FILE_NOT_FOUND';
      throw error;
    }
  }

  /**
   * Deletes a file from storage.
   *
   * @param {string} storageKey
   * @returns {Promise<boolean>}
   */
  async deleteFile(storageKey) {
    try {
      const filePath = this.resolveSafePath(storageKey);
      await fs.promises.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export const storageService = new StorageService();
export default storageService;
