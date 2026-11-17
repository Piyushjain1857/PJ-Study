import test from 'node:test';
import assert from 'node:assert/strict';
import { StorageService, ALLOWED_DOCUMENT_TYPES, FORBIDDEN_EXTENSIONS } from '../src/services/storage/storage.service.js';
import { GoogleDriveStorageProvider, GDRIVE_OAUTH_SCOPES } from '../src/services/storage/googleDrive.provider.js';
import { sanitizeNote } from '../src/modules/notes/note.service.js';

test('Google Drive Storage Provider & Unified Storage Architecture', async (t) => {
  await t.test('1. Google OAuth scopes strictly follow least privilege (drive.file)', () => {
    assert.deepEqual(GDRIVE_OAUTH_SCOPES, ['https://www.googleapis.com/auth/drive.file']);
  });

  await t.test('2. GoogleDriveStorageProvider reports unconfigured when missing credentials', () => {
    const provider = new GoogleDriveStorageProvider();
    provider.setCredentials({ clientId: '', clientSecret: '', refreshToken: '' });
    assert.equal(provider.isConfigured(), false);
  });

  await t.test('3. GoogleDriveStorageProvider generates valid offline consent authorization URL', () => {
    const provider = new GoogleDriveStorageProvider();
    provider.setCredentials({
      clientId: 'test-client-id-12345.apps.googleusercontent.com',
      clientSecret: 'test-client-secret',
      redirectUri: 'http://localhost:5001/api/v1/storage/google/oauth/callback'
    });

    const authUrl = provider.generateAuthUrl('test_state');
    assert.ok(authUrl.startsWith('https://accounts.google.com/o/oauth2/v2/auth'));
    assert.ok(authUrl.includes('access_type=offline'));
    assert.ok(authUrl.includes('prompt=consent'));
    assert.ok(authUrl.includes(encodeURIComponent('https://www.googleapis.com/auth/drive.file')));
    assert.ok(authUrl.includes('state=test_state'));
  });

  await t.test('4. StorageService falls back safely to local storage when Drive is unconfigured', () => {
    const mockDrive = { isConfigured: () => false };
    const mockLocal = { saveFile: async () => ({ storageKey: 'local-123', storageProvider: 'local' }) };
    const service = new StorageService(mockLocal, mockDrive);

    assert.equal(service.getActiveProvider(), 'local');
  });

  await t.test('5. sanitizeNote strips storageKey / Drive file ID from public response', () => {
    const rawNote = {
      id: 'note-uuid-123',
      title: 'Operating Systems Chapter 1',
      fileName: 'OS_Unit_1.pdf',
      storageKey: '1aB2cD3eF4gH5iJ6kL7mN8oP9qR0sT', // Google Drive File ID
      storageProvider: 'google_drive',
      fileSize: 1048576n,
      mimeType: 'application/pdf',
      status: 'PUBLISHED'
    };

    const sanitized = sanitizeNote(rawNote);

    // CRITICAL SECURITY ASSERTION: storageKey must NEVER be present in client payload
    assert.equal(sanitized.storageKey, undefined);
    assert.equal(sanitized.id, 'note-uuid-123');
    assert.equal(sanitized.title, 'Operating Systems Chapter 1');
    assert.equal(sanitized.fileName, 'OS_Unit_1.pdf');
    assert.equal(sanitized.storageProvider, 'google_drive');
    assert.equal(sanitized.fileSize, '1048576');
  });

  await t.test('6. StorageService rejects dangerous executable files', async () => {
    const mockLocal = {};
    const mockDrive = {};
    const service = new StorageService(mockLocal, mockDrive);

    await assert.rejects(
      service.saveFile({
        buffer: Buffer.from('#!/bin/bash\nrm -rf /'),
        originalname: 'exploit.sh'
      }),
      (err) => err.code === 'FILE_TYPE_PROHIBITED'
    );
  });

  await t.test('7. StorageService rejects spoofed files failing magic bytes check', async () => {
    const mockLocal = {};
    const mockDrive = {};
    const service = new StorageService(mockLocal, mockDrive);

    await assert.rejects(
      service.saveFile({
        buffer: Buffer.from('FAKE-NON-PDF-CONTENT'),
        originalname: 'lecture.pdf'
      }),
      (err) => err.code === 'FILE_SIGNATURE_MISMATCH'
    );
  });

  await t.test('8. StorageService correctly delegates getFileStream to specified provider', async () => {
    let localCalled = false;
    let driveCalled = false;

    const mockLocal = {
      getFileStream: async (key) => {
        localCalled = true;
        return { key, provider: 'local' };
      }
    };
    const mockDrive = {
      getFileStream: async (key) => {
        driveCalled = true;
        return { key, provider: 'google_drive' };
      }
    };

    const service = new StorageService(mockLocal, mockDrive);

    await service.getFileStream('file-local-key', 'local');
    assert.equal(localCalled, true);
    assert.equal(driveCalled, false);

    await service.getFileStream('1gDriveFileId999', 'google_drive');
    assert.equal(driveCalled, true);
  });

  await t.test('9. StorageService correctly delegates deleteFile to specified provider', async () => {
    let deletedFromDrive = false;

    const mockLocal = { deleteFile: async () => true };
    const mockDrive = {
      deleteFile: async (key) => {
        if (key === 'gdrive-file-to-delete') deletedFromDrive = true;
        return true;
      }
    };

    const service = new StorageService(mockLocal, mockDrive);
    await service.deleteFile('gdrive-file-to-delete', 'google_drive');
    assert.equal(deletedFromDrive, true);
  });
});
