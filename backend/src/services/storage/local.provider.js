import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import env from '../../config/env.js';

/**
 * Local Filesystem Storage Provider.
 * Preserves backward compatibility for notes stored on the server's local disk.
 */
export class LocalStorageProvider {
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
      console.error(`[LocalStorageProvider] Failed to create directory at ${this.baseDir}:`, err.message);
    }
  }

  /**
   * Saves an uploaded buffer to local disk with random hashed name.
   *
   * @param {{
   *   buffer: Buffer,
   *   originalname: string,
   *   mimetype?: string,
   *   size?: number
   * }} file
   * @param {string} ext
   * @param {string} detectedMime
   * @returns {Promise<{
   *   storageKey: string,
   *   fileName: string,
   *   fileSize: bigint,
   *   mimeType: string,
   *   storageProvider: 'local'
   * }>}
   */
  async saveFile(file, ext, detectedMime) {
    const originalName = path.basename(file.originalname || 'document.pdf');
    const randomHash = crypto.randomBytes(16).toString('hex');
    const storageKey = `${Date.now()}-${randomHash}${ext}`;
    const destinationPath = path.join(this.baseDir, storageKey);

    await fs.promises.writeFile(destinationPath, file.buffer);

    return {
      storageKey,
      fileName: originalName,
      fileSize: BigInt(file.buffer.length),
      mimeType: detectedMime,
      storageProvider: 'local'
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

    const safeBaseName = path.basename(storageKey);
    const resolved = path.join(this.baseDir, safeBaseName);

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
   * Checks if stored file exists locally.
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
   * Retrieves readable stream for downloading or previewing a local file.
   * Supports optional range headers for PDF byte-range requests.
   *
   * @param {string} storageKey
   * @param {{ start?: number, end?: number }} [rangeOptions]
   * @returns {Promise<{ stream: fs.ReadStream, size: number, totalSize: number }>}
   */
  async getFileStream(storageKey, rangeOptions = null) {
    const filePath = this.resolveSafePath(storageKey);
    try {
      const stat = await fs.promises.stat(filePath);
      const totalSize = stat.size;

      if (rangeOptions && typeof rangeOptions.start === 'number') {
        const start = rangeOptions.start;
        const end = typeof rangeOptions.end === 'number' ? rangeOptions.end : totalSize - 1;
        const stream = fs.createReadStream(filePath, { start, end });
        return {
          stream,
          size: end - start + 1,
          totalSize,
          isRange: true,
          start,
          end
        };
      }

      const stream = fs.createReadStream(filePath);
      return { stream, size: totalSize, totalSize, isRange: false };
    } catch {
      const error = new Error('Stored study material file was not found on local disk.');
      error.statusCode = 404;
      error.code = 'FILE_NOT_FOUND';
      throw error;
    }
  }

  /**
   * Deletes a file from local storage.
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

  /**
   * Health check for local disk storage.
   */
  async checkHealth() {
    try {
      await fs.promises.access(this.baseDir, fs.constants.W_OK);
      return {
        healthy: true,
        provider: 'local',
        directory: this.baseDir
      };
    } catch (err) {
      return {
        healthy: false,
        provider: 'local',
        error: err.message
      };
    }
  }
}

export const localStorageProvider = new LocalStorageProvider();
export default localStorageProvider;
