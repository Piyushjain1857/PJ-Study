import { Readable } from 'stream';
import path from 'path';
import { google } from 'googleapis';
import env from '../../config/env.js';

export const GDRIVE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/drive.file'
];

/**
 * Google Drive Private Cloud Storage Provider.
 * Stores academic manuscripts privately in a dedicated Google Drive folder
 * using OAuth 2.0 refresh tokens. All file streams pass through Express.
 */
export class GoogleDriveStorageProvider {
  constructor() {
    this.clientId = env.googleClientId;
    this.clientSecret = env.googleClientSecret;
    this.refreshToken = env.googleRefreshToken;
    this.folderId = env.googleDriveFolderId;
    this.redirectUri = env.googleRedirectUri;

    this.oauth2Client = null;
    this.driveClient = null;
    this.folderCache = new Map(); // path -> folderId

    this.initializeClient();
  }

  /**
   * Initializes OAuth2 client if credentials are configured.
   */
  initializeClient() {
    if (this.clientId && this.clientSecret) {
      this.oauth2Client = new google.auth.OAuth2(
        this.clientId,
        this.clientSecret,
        this.redirectUri
      );

      if (this.refreshToken) {
        this.oauth2Client.setCredentials({
          refresh_token: this.refreshToken
        });

        this.driveClient = google.drive({
          version: 'v3',
          auth: this.oauth2Client
        });
      } else {
        this.driveClient = null;
      }
    } else {
      this.oauth2Client = null;
      this.driveClient = null;
    }
  }

  /**
   * Updates credentials at runtime (e.g. after one-time authorization).
   */
  setCredentials({ clientId, clientSecret, refreshToken, folderId, redirectUri }) {
    if (clientId !== undefined) this.clientId = clientId;
    if (clientSecret !== undefined) this.clientSecret = clientSecret;
    if (refreshToken !== undefined) this.refreshToken = refreshToken;
    if (folderId !== undefined) this.folderId = folderId;
    if (redirectUri !== undefined) this.redirectUri = redirectUri;

    this.initializeClient();
  }

  /**
   * Checks whether Google Drive storage has complete OAuth credentials.
   *
   * @returns {boolean}
   */
  isConfigured() {
    return Boolean(this.clientId && this.clientSecret && this.refreshToken && this.driveClient);
  }

  /**
   * Generates Google OAuth consent screen authorization URL.
   *
   * @param {string} [state] Optional state token for CSRF protection
   * @returns {string} URL to redirect the administrator
   */
  generateAuthUrl(state = '') {
    if (!this.oauth2Client) {
      if (!this.clientId || !this.clientSecret) {
        throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required to generate authorization URL.');
      }
      this.oauth2Client = new google.auth.OAuth2(
        this.clientId,
        this.clientSecret,
        this.redirectUri
      );
    }

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: GDRIVE_OAUTH_SCOPES,
      state
    });
  }

  /**
   * Exchanges authorization code for long-lived refresh token.
   *
   * @param {string} code
   * @returns {Promise<{ refreshToken: string, accessToken: string }>}
   */
  async getTokensFromCode(code) {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET first.');
    }

    const { tokens } = await this.oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
      throw new Error(
        'Google did not return a refresh token. Make sure "prompt=consent" and "access_type=offline" were used, ' +
        'or revoke existing app permissions in your Google Account security settings and re-authorize.'
      );
    }

    this.refreshToken = tokens.refresh_token;
    this.oauth2Client.setCredentials(tokens);
    this.driveClient = google.drive({ version: 'v3', auth: this.oauth2Client });

    return {
      refreshToken: tokens.refresh_token,
      accessToken: tokens.access_token
    };
  }

  /**
   * Resolves or creates organizational subfolders in Google Drive.
   * Prevents creating duplicate folders on repeated uploads.
   *
   * @param {object} [metadata]
   * @returns {Promise<string>} Folder ID
   */
  async resolveDestinationFolder(metadata = {}) {
    if (!this.isConfigured()) {
      throw new Error('Google Drive client is not configured.');
    }

    // Default to configured folder ID or find/create "PJ Study Notes"
    let parentFolderId = this.folderId;
    if (!parentFolderId) {
      parentFolderId = await this.findOrCreateFolder('PJ Study Notes', 'root');
    }

    // Optional organizational hierarchy: <Course> / Semester <N>
    const courseName = metadata.courseName || metadata.course?.name || '';
    const semester = metadata.semester ? `Semester ${metadata.semester}` : '';

    if (!courseName) {
      return parentFolderId;
    }

    const sanitizedCourse = courseName.replace(/[/\\?%*:|"<>]/g, '-').trim();
    const courseFolderKey = `${parentFolderId}::${sanitizedCourse}`;

    let courseFolderId = this.folderCache.get(courseFolderKey);
    if (!courseFolderId) {
      courseFolderId = await this.findOrCreateFolder(sanitizedCourse, parentFolderId);
      this.folderCache.set(courseFolderKey, courseFolderId);
    }

    if (!semester) {
      return courseFolderId;
    }

    const semesterFolderKey = `${courseFolderId}::${semester}`;
    let semesterFolderId = this.folderCache.get(semesterFolderKey);
    if (!semesterFolderId) {
      semesterFolderId = await this.findOrCreateFolder(semester, courseFolderId);
      this.folderCache.set(semesterFolderKey, semesterFolderId);
    }

    return semesterFolderId;
  }

  /**
   * Finds an existing folder by name under a parent, or creates it if missing.
   *
   * @param {string} folderName
   * @param {string} parentId
   * @returns {Promise<string>}
   */
  async findOrCreateFolder(folderName, parentId) {
    const escapedName = folderName.replace(/'/g, "\\'");
    const q = `mimeType = 'application/vnd.google-apps.folder' and name = '${escapedName}' and '${parentId}' in parents and trashed = false`;

    try {
      const list = await this.driveClient.files.list({
        q,
        fields: 'files(id, name)',
        spaces: 'drive',
        pageSize: 1
      });

      if (list.data.files && list.data.files.length > 0) {
        return list.data.files[0].id;
      }

      // Create new private folder
      const createRes = await this.driveClient.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
          parents: [parentId],
          description: 'PJ Study academic manuscript storage folder'
        },
        fields: 'id, name'
      });

      return createRes.data.id;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[GoogleDrive] Failed to find or create folder "${folderName}":`, err.message);
      // Fallback to parent
      return parentId;
    }
  }

  /**
   * Uploads a file buffer to private Google Drive storage.
   * Bounded exponential retry for transient network failures.
   *
   * @param {{
   *   buffer: Buffer,
   *   originalname: string,
   *   mimetype?: string
   * }} file
   * @param {string} ext
   * @param {string} detectedMime
   * @param {object} [academicMetadata]
   * @returns {Promise<{
   *   storageKey: string,
   *   fileName: string,
   *   fileSize: bigint,
   *   mimeType: string,
   *   storageProvider: 'google_drive'
   * }>}
   */
  async saveFile(file, ext, detectedMime, academicMetadata = {}) {
    if (!this.isConfigured()) {
      const error = new Error('Google Drive storage is not configured on this server.');
      error.statusCode = 503;
      error.code = 'STORAGE_NOT_CONFIGURED';
      throw error;
    }

    const originalName = path.basename(file.originalname || 'study-document.pdf');
    const destinationFolderId = await this.resolveDestinationFolder(academicMetadata);

    let lastError = null;
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const streamBody = Readable.from(file.buffer);

        const response = await this.driveClient.files.create({
          requestBody: {
            name: originalName,
            parents: [destinationFolderId],
            mimeType: detectedMime,
            description: `PJ Study uploaded manuscript: ${originalName}`
          },
          media: {
            mimeType: detectedMime,
            body: streamBody
          },
          fields: 'id, name, mimeType, size'
        });

        const fileId = response.data.id;
        if (!fileId) {
          throw new Error('Google Drive did not return a valid file ID.');
        }

        const size = response.data.size
          ? BigInt(response.data.size)
          : BigInt(file.buffer.length);

        // Safe diagnostic audit logging (no tokens or credentials)
        // eslint-disable-next-line no-console
        console.log(
          `[AUDIT:GDRIVE_FILE_SAVED] timestamp=${new Date().toISOString()} fileName="${originalName}" destinationFolderId="${destinationFolderId}" driveFileId="${fileId}" size=${size} provider=google_drive result=SUCCESS`
        );

        return {
          storageKey: fileId,
          fileName: originalName,
          fileSize: size,
          mimeType: response.data.mimeType || detectedMime,
          storageProvider: 'google_drive'
        };
      } catch (err) {
        lastError = err;
        // eslint-disable-next-line no-console
        console.warn(
          `[AUDIT:GDRIVE_UPLOAD_ATTEMPT_FAILED] timestamp=${new Date().toISOString()} fileName="${originalName}" attempt=${attempt + 1}/${maxRetries + 1} error="${err.message}"`
        );
        // eslint-disable-next-line no-console
        console.warn(`[GoogleDrive] Upload attempt ${attempt + 1} failed: ${err.message}`);
        if (attempt < maxRetries) {
          await new Promise((r) => setTimeout(r, (attempt + 1) * 800));
        }
      }
    }

    const error = new Error(`Failed to upload document to Google Drive storage: ${lastError?.message || 'Unknown network error'}`);
    error.statusCode = 502;
    error.code = 'GOOGLE_DRIVE_UPLOAD_FAILED';
    throw error;
  }

  /**
   * Retrieves metadata for a file in Google Drive.
   *
   * @param {string} fileId
   * @returns {Promise<{
   *   id: string,
   *   name: string,
   *   mimeType: string,
   *   size: number,
   *   trashed: boolean
   * }>}
   */
  async getFileMetadata(fileId) {
    if (!this.isConfigured()) {
      throw new Error('Google Drive client is not configured.');
    }

    const res = await this.driveClient.files.get({
      fileId,
      fields: 'id, name, mimeType, size, trashed'
    });

    if (!res.data || !res.data.id) {
      const error = new Error('File not found in Google Drive.');
      error.statusCode = 404;
      throw error;
    }

    return {
      id: res.data.id,
      name: res.data.name,
      mimeType: res.data.mimeType,
      size: parseInt(res.data.size || '0', 10),
      trashed: Boolean(res.data.trashed)
    };
  }

  /**
   * Retrieves readable stream from private Google Drive file.
   * Supports optional range headers for PDF byte-range requests.
   *
   * @param {string} fileId
   * @param {{ start?: number, end?: number }} [rangeOptions]
   * @returns {Promise<{
   *   stream: Readable,
   *   size: number,
   *   totalSize: number,
   *   isRange: boolean,
   *   mimeType: string,
   *   fileName: string
   * }>}
   */
  async getFileStream(fileId, rangeOptions = null) {
    if (!this.isConfigured()) {
      const error = new Error('Google Drive storage is not configured on this server.');
      error.statusCode = 503;
      error.code = 'STORAGE_NOT_CONFIGURED';
      throw error;
    }

    // 1. Fetch file metadata first to obtain exact size and MIME
    let meta;
    try {
      const metaRes = await this.driveClient.files.get({
        fileId,
        fields: 'id, name, mimeType, size, trashed'
      });
      meta = metaRes.data;

      if (meta.trashed) {
        const error = new Error('The requested study document has been trashed in storage.');
        error.statusCode = 404;
        error.code = 'FILE_TRASHED';
        throw error;
      }
    } catch (err) {
      if (err.statusCode === 404 || err.code === 404 || err.message?.includes('File not found')) {
        const error = new Error('Stored study material was not found in Google Drive.');
        error.statusCode = 404;
        error.code = 'FILE_NOT_FOUND';
        throw error;
      }
      throw err;
    }

    const totalSize = parseInt(meta.size || '0', 10);
    const headers = {};
    let isRange = false;
    let streamSize = totalSize;
    let start = 0;
    let end = totalSize > 0 ? totalSize - 1 : 0;

    if (rangeOptions && typeof rangeOptions.start === 'number') {
      start = rangeOptions.start;
      end = typeof rangeOptions.end === 'number' ? rangeOptions.end : (totalSize > 0 ? totalSize - 1 : 0);
      headers.Range = `bytes=${start}-${end}`;
      isRange = true;
      streamSize = end - start + 1;
    }

    try {
      const mediaRes = await this.driveClient.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream', headers }
      );

      return {
        stream: mediaRes.data,
        size: streamSize,
        totalSize,
        isRange,
        start,
        end,
        mimeType: meta.mimeType || 'application/pdf',
        fileName: meta.name || 'document.pdf'
      };
    } catch (err) {
      const error = new Error(`Failed to stream document from Google Drive: ${err.message}`);
      error.statusCode = 502;
      error.code = 'GOOGLE_DRIVE_STREAM_FAILED';
      throw error;
    }
  }

  /**
   * Deletes a file from Google Drive.
   *
   * @param {string} fileId
   * @returns {Promise<boolean>}
   */
  async deleteFile(fileId) {
    if (!this.isConfigured()) return false;
    try {
      await this.driveClient.files.delete({ fileId });
      return true;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn(`[GoogleDrive] Failed to delete file ${fileId}:`, err.message);
      return false;
    }
  }

  /**
   * Checks storage health, storage quota, and folder accessibility.
   *
   * @returns {Promise<{
   *   healthy: boolean,
   *   provider: 'google_drive',
   *   user?: string,
   *   storageQuota?: object,
   *   error?: string
   * }>}
   */
  async checkHealth() {
    if (!this.isConfigured()) {
      return {
        healthy: false,
        provider: 'google_drive',
        error: 'Google Drive client credentials not fully configured.'
      };
    }

    try {
      const about = await this.driveClient.about.get({
        fields: 'user, storageQuota'
      });

      return {
        healthy: true,
        provider: 'google_drive',
        user: about.data.user?.emailAddress || 'Authorized Account',
        storageQuota: about.data.storageQuota
      };
    } catch (err) {
      return {
        healthy: false,
        provider: 'google_drive',
        error: err.message
      };
    }
  }
}

export const googleDriveProvider = new GoogleDriveStorageProvider();
export default googleDriveProvider;
