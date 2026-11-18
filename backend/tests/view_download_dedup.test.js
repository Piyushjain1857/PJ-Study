import test from 'node:test';
import assert from 'node:assert/strict';
import noteService from '../src/modules/notes/note.service.js';
import prisma from '../src/config/database.js';

test('View and Download Deduplication & Debounce Protection', async (t) => {
  let testNote;
  let createdTestNoteId = null;

  // Setup: Find or create a published note for testing
  t.before(async () => {
    testNote = await prisma.note.findFirst({
      where: { status: 'PUBLISHED' }
    });

    if (!testNote) {
      // Find a user and subject to create one
      const user = await prisma.user.findFirst();
      const subject = await prisma.subject.findFirst();
      if (user && subject) {
        testNote = await prisma.note.create({
          data: {
            title: 'Test Dedup Manuscript',
            content: 'Test content for dedup test',
            status: 'PUBLISHED',
            courseId: subject.courseId,
            subjectId: subject.id,
            uploadedById: user.id,
            viewCount: 10,
            downloadCount: 5,
            storageKey: 'local/test.pdf',
            storageProvider: 'local'
          }
        });
        createdTestNoteId = testNote.id;
      }
    }
  });

  t.after(async () => {
    if (createdTestNoteId) {
      await prisma.note.deleteMany({ where: { id: createdTestNoteId } }).catch(() => {});
    }
  });

  await t.test('Viewing note debounces rapid requests from same IP / session', async () => {
    if (!testNote) return;

    const initialNote = await prisma.note.findUnique({ where: { id: testNote.id } });
    const initialViews = initialNote.viewCount;

    const testIp = `192.0.2.${Math.floor(Math.random() * 200) + 10}`;

    // First view: should increment
    const res1 = await noteService.getNoteById(testNote.id, null, true, testIp);
    assert.equal(res1.viewCount, initialViews + 1);

    // Second view from same IP: must be debounced (NOT increment)
    const res2 = await noteService.getNoteById(testNote.id, null, true, testIp);
    assert.equal(res2.viewCount, initialViews + 1);

    // Third view with authenticated user from same IP: must ALSO be debounced
    const res3 = await noteService.getNoteById(testNote.id, { id: 'usr_test_dedup' }, true, testIp);
    assert.equal(res3.viewCount, initialViews + 1);
  });

  await t.test('Inline preview requests NEVER increment download count', async () => {
    if (!testNote) return;

    const initialNote = await prisma.note.findUnique({ where: { id: testNote.id } });
    const initialDownloads = initialNote.downloadCount;

    const testIp = `198.51.100.${Math.floor(Math.random() * 200) + 10}`;

    // Mock storage getFileStream to avoid requiring real file on disk
    const originalGetFileStream = noteService.storage.getFileStream;
    noteService.storage.getFileStream = async () => ({
      stream: null,
      fileName: 'test.pdf',
      mimeType: 'application/pdf',
      size: 1024
    });

    try {
      // 1. Inline preview request (e.g. from iframe)
      await noteService.getNoteFileForDownload(testNote.id, null, {
        isInline: true,
        clientIp: testIp
      });

      const afterPreview = await prisma.note.findUnique({ where: { id: testNote.id } });
      assert.equal(afterPreview.downloadCount, initialDownloads, 'Preview must NOT increment downloadCount');

      // 2. Range request (start=0, e.g. PDF reader header request)
      await noteService.getNoteFileForDownload(testNote.id, null, {
        isInline: false,
        rangeOptions: { start: 0, end: 512 },
        clientIp: testIp
      });

      const afterRange = await prisma.note.findUnique({ where: { id: testNote.id } });
      assert.equal(afterRange.downloadCount, initialDownloads, 'Range request must NOT increment downloadCount');

      // 3. Full download: should increment once
      await noteService.getNoteFileForDownload(testNote.id, null, {
        isInline: false,
        rangeOptions: null,
        clientIp: testIp
      });

      const afterDownload = await prisma.note.findUnique({ where: { id: testNote.id } });
      assert.equal(afterDownload.downloadCount, initialDownloads + 1, 'Full download must increment downloadCount by 1');

      // 4. Repeated download within debounce window from same IP: must NOT increment
      await noteService.getNoteFileForDownload(testNote.id, null, {
        isInline: false,
        rangeOptions: null,
        clientIp: testIp
      });

      const afterRepeatDownload = await prisma.note.findUnique({ where: { id: testNote.id } });
      assert.equal(afterRepeatDownload.downloadCount, initialDownloads + 1, 'Debounced repeat download must NOT increment downloadCount again');
    } finally {
      noteService.storage.getFileStream = originalGetFileStream;
    }
  });
});
