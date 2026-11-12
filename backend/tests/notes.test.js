import test from 'node:test';
import assert from 'node:assert/strict';
import prisma from '../src/config/database.js';
import { generateAccessToken } from '../src/services/tokens/token.service.js';
import { storageService } from '../src/services/storage/storage.service.js';
import noteService from '../src/modules/notes/note.service.js';
import { createServer } from 'http';
import app from '../src/app.js';

test('Notes Management System — Domain, Storage, API & Moderation Tests', async (t) => {
  let server;
  let baseUrl;

  // Test Entities
  let studentUser;
  let otherStudentUser;
  let moderatorUser;
  let adminUser;
  let testCourse;
  let testSubject;
  let testCategory;

  let studentToken;
  let otherStudentToken;
  let moderatorToken;
  let adminToken;

  t.before(async () => {
    // Start temporary test HTTP server
    server = createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;

    // Clean up previous test notes if any
    await prisma.review.deleteMany({
      where: { user: { email: { contains: 'notetest' } } }
    });
    await prisma.bookmark.deleteMany({
      where: { user: { email: { contains: 'notetest' } } }
    });
    await prisma.note.deleteMany({
      where: { title: { contains: 'Test Note' } }
    });

    // Create course and subject
    testCourse = await prisma.course.upsert({
      where: { slug: 'test-eng-course' },
      update: {},
      create: {
        name: 'Test Engineering Course',
        slug: 'test-eng-course',
        description: 'For automated tests'
      }
    });

    testSubject = await prisma.subject.upsert({
      where: {
        course_subject_slug_unique: {
          courseId: testCourse.id,
          slug: 'test-algorithms'
        }
      },
      update: {},
      create: {
        courseId: testCourse.id,
        name: 'Test Algorithms',
        slug: 'test-algorithms',
        semester: 3
      }
    });

    testCategory = await prisma.category.upsert({
      where: { slug: 'test-lecture-notes' },
      update: {},
      create: {
        name: 'Test Lecture Notes',
        slug: 'test-lecture-notes',
        description: 'Testing category'
      }
    });

    // Create test accounts
    studentUser = await prisma.user.upsert({
      where: { email: 'student1@notetest.edu' },
      update: { role: 'STUDENT', isActive: true, isEmailVerified: true },
      create: {
        name: 'Student One',
        email: 'student1@notetest.edu',
        passwordHash: 'dummy_hash',
        role: 'STUDENT',
        isActive: true,
        isEmailVerified: true
      }
    });

    otherStudentUser = await prisma.user.upsert({
      where: { email: 'student2@notetest.edu' },
      update: { role: 'STUDENT', isActive: true, isEmailVerified: true },
      create: {
        name: 'Student Two',
        email: 'student2@notetest.edu',
        passwordHash: 'dummy_hash',
        role: 'STUDENT',
        isActive: true,
        isEmailVerified: true
      }
    });

    moderatorUser = await prisma.user.upsert({
      where: { email: 'moderator@notetest.edu' },
      update: { role: 'MODERATOR', isActive: true, isEmailVerified: true },
      create: {
        name: 'Moderator Staff',
        email: 'moderator@notetest.edu',
        passwordHash: 'dummy_hash',
        role: 'MODERATOR',
        isActive: true,
        isEmailVerified: true
      }
    });

    adminUser = await prisma.user.upsert({
      where: { email: 'admin@notetest.edu' },
      update: { role: 'ADMIN', isActive: true, isEmailVerified: true },
      create: {
        name: 'Admin Staff',
        email: 'admin@notetest.edu',
        passwordHash: 'dummy_hash',
        role: 'ADMIN',
        isActive: true,
        isEmailVerified: true
      }
    });

    // Issue test tokens
    studentToken = generateAccessToken(studentUser);
    otherStudentToken = generateAccessToken(otherStudentUser);
    moderatorToken = generateAccessToken(moderatorUser);
    adminToken = generateAccessToken(adminUser);
  });

  t.after(async () => {
    // Teardown
    await prisma.auditLog.deleteMany({
      where: { entityType: 'Note' }
    });
    await prisma.note.deleteMany({
      where: { title: { contains: 'Test Note' } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'notetest' } }
    });
    await prisma.category.deleteMany({
      where: { slug: 'test-lecture-notes' }
    });
    await prisma.subject.deleteMany({
      where: { slug: 'test-algorithms' }
    });
    await prisma.course.deleteMany({
      where: { slug: 'test-eng-course' }
    });

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // =========================================================================
  // 1. Storage Service & File Validation Invariants
  // =========================================================================

  await t.test('Storage service should accept valid PDF buffer and generate safe key', async () => {
    // Valid PDF signature %PDF-
    const pdfBuffer = Buffer.from('%PDF-1.4 sample pdf content for testing');
    const result = await storageService.saveFile({
      buffer: pdfBuffer,
      originalname: 'Lecture-Week1.pdf',
      mimetype: 'application/pdf'
    });

    assert.ok(result.storageKey);
    assert.equal(result.fileName, 'Lecture-Week1.pdf');
    assert.equal(result.fileSize, BigInt(pdfBuffer.length));
    assert.equal(result.mimeType, 'application/pdf');

    // Confirm file exists on disk
    const exists = await storageService.fileExists(result.storageKey);
    assert.equal(exists, true);

    // Clean up
    await storageService.deleteFile(result.storageKey);
  });

  await t.test(
    'Storage service should reject dangerous executable extensions (.exe, .sh)',
    async () => {
      const exeBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00');
      await assert.rejects(
        storageService.saveFile({
          buffer: exeBuffer,
          originalname: 'malware.exe',
          mimetype: 'application/octet-stream'
        }),
        { statusCode: 400, code: 'FILE_TYPE_PROHIBITED' }
      );
    }
  );

  await t.test('Storage service should reject mismatched spoofed file content', async () => {
    // Claim to be .pdf but bytes are plain random text without %PDF-
    const fakeBuffer = Buffer.from('not a pdf at all');
    await assert.rejects(
      storageService.saveFile({
        buffer: fakeBuffer,
        originalname: 'fake.pdf',
        mimetype: 'application/pdf'
      }),
      { statusCode: 400, code: 'FILE_SIGNATURE_MISMATCH' }
    );
  });

  // =========================================================================
  // 2. Note Creation & Field Validation (HTTP API)
  // =========================================================================

  let createdDraftId;
  let otherStudentDraftId;

  await t.test('POST /api/v1/notes should create a DRAFT text note with valid fields', async () => {
    const res = await fetch(`${baseUrl}/api/v1/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        title: 'Test Note: Binary Search Analysis',
        description: 'Comprehensive time complexity proofs',
        content: '# Binary Search\n\nRuns in O(log n) worst case.',
        subjectId: testSubject.id,
        categoryId: testCategory.id,
        semester: 3,
        status: 'DRAFT'
      })
    });

    assert.equal(res.status, 201);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.title, 'Test Note: Binary Search Analysis');
    assert.equal(json.data.status, 'DRAFT');
    assert.ok(json.data.slug);
    createdDraftId = json.data.id;
  });

  await t.test('POST /api/v1/notes should reject empty title', async () => {
    const res = await fetch(`${baseUrl}/api/v1/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        title: '   ',
        content: 'Some valid content',
        subjectId: testSubject.id
      })
    });

    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.error.code, 'TITLE_REQUIRED');
  });

  await t.test('POST /api/v1/notes should reject creation without content or file', async () => {
    const res = await fetch(`${baseUrl}/api/v1/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        title: 'Test Note: Empty Payload',
        subjectId: testSubject.id
      })
    });

    assert.equal(res.status, 400);
    const json = await res.json();
    assert.equal(json.error.code, 'NOTE_PAYLOAD_EMPTY');
  });

  await t.test(
    'POST /api/v1/notes should prohibit student from publishing directly as APPROVED',
    async () => {
      const res = await fetch(`${baseUrl}/api/v1/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          title: 'Test Note: Illegal Direct Publish',
          content: 'Trying to bypass review',
          subjectId: testSubject.id,
          status: 'APPROVED'
        })
      });

      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.error.code, 'UNAUTHORIZED_PUBLISH');
    }
  );

  // Create a note for the other student
  await t.test('Setup: Create second student draft', async () => {
    const note = await noteService.createNote({
      title: 'Test Note: Student Two Secret Draft',
      content: 'Private research manuscript',
      subjectId: testSubject.id,
      uploadedById: otherStudentUser.id,
      status: 'DRAFT'
    });
    otherStudentDraftId = note.id;
    assert.ok(otherStudentDraftId);
  });

  // =========================================================================
  // 3. Ownership & Private Draft Isolation
  // =========================================================================

  await t.test('GET /api/v1/notes/:id - Owner can view their own private draft', async () => {
    const res = await fetch(`${baseUrl}/api/v1/notes/${createdDraftId}`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.id, createdDraftId);
  });

  await t.test(
    'GET /api/v1/notes/:id - Other students cannot view a private draft (403 forbidden)',
    async () => {
      const res = await fetch(`${baseUrl}/api/v1/notes/${otherStudentDraftId}`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.error.code, 'NOTE_ACCESS_FORBIDDEN');
    }
  );

  await t.test('PATCH /api/v1/notes/:id - Student can edit their own draft', async () => {
    const res = await fetch(`${baseUrl}/api/v1/notes/${createdDraftId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        title: 'Test Note: Binary Search Master Class',
        description: 'Updated description for algorithms'
      })
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.title, 'Test Note: Binary Search Master Class');
  });

  await t.test('PATCH /api/v1/notes/:id - Student cannot modify another student note', async () => {
    const res = await fetch(`${baseUrl}/api/v1/notes/${otherStudentDraftId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        title: 'Test Note: Malicious Tampering'
      })
    });
    assert.equal(res.status, 403);
    const json = await res.json();
    assert.equal(json.error.code, 'FORBIDDEN_OWNERSHIP');
  });

  await t.test(
    'DELETE /api/v1/notes/:id - Student cannot delete another student note',
    async () => {
      const res = await fetch(`${baseUrl}/api/v1/notes/${otherStudentDraftId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.error.code, 'FORBIDDEN_OWNERSHIP');
    }
  );

  // =========================================================================
  // 4. Submission & Moderation Lifecycle (Draft -> Pending -> Approved / Rejected)
  // =========================================================================

  await t.test(
    'POST /api/v1/notes/:id/submit - Owner submits draft for moderation review',
    async () => {
      const res = await fetch(`${baseUrl}/api/v1/notes/${createdDraftId}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.status, 'PENDING_REVIEW');
    }
  );

  await t.test(
    'PATCH /api/v1/notes/:id - Student cannot edit note while under review',
    async () => {
      const res = await fetch(`${baseUrl}/api/v1/notes/${createdDraftId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({ title: 'Attempted Edit While Pending' })
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.error.code, 'NOTE_EDIT_LOCKED');
    }
  );

  await t.test(
    'POST /api/v1/notes/:id/review - Student cannot review/approve their own note',
    async () => {
      const res = await fetch(`${baseUrl}/api/v1/notes/${createdDraftId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({ status: 'APPROVED' })
      });
      assert.equal(res.status, 403);
    }
  );

  await t.test(
    'GET /api/v1/notes/moderation/queue - Moderator can view pending queue',
    async () => {
      const res = await fetch(`${baseUrl}/api/v1/notes/moderation/queue`, {
        headers: { Authorization: `Bearer ${moderatorToken}` }
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.ok(Array.isArray(json.data.items || json.data.data));
    }
  );

  await t.test('POST /api/v1/notes/:id/review - Moderator rejects note with reason', async () => {
    const res = await fetch(`${baseUrl}/api/v1/notes/${createdDraftId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${moderatorToken}`
      },
      body: JSON.stringify({
        status: 'REJECTED',
        reason: 'Please add explicit pseudocode before resubmission.'
      })
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.status, 'REJECTED');
    assert.equal(json.data.rejectionReason, 'Please add explicit pseudocode before resubmission.');
  });

  await t.test(
    'PATCH /api/v1/notes/:id - Student can update rejected note with feedback fixes',
    async () => {
      const res = await fetch(`${baseUrl}/api/v1/notes/${createdDraftId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          content: '# Binary Search with Pseudocode\n\n```python\ndef bs(): pass\n```'
        })
      });
      assert.equal(res.status, 200);
    }
  );

  await t.test('POST /api/v1/notes/:id/submit - Student resubmits rejected note', async () => {
    const res = await fetch(`${baseUrl}/api/v1/notes/${createdDraftId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.status, 'PENDING_REVIEW');
    assert.equal(json.data.rejectionReason, null); // cleared on resubmit
  });

  await t.test(
    'POST /api/v1/notes/:id/review - Moderator approves note and sets publishedAt',
    async () => {
      const res = await fetch(`${baseUrl}/api/v1/notes/${createdDraftId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${moderatorToken}`
        },
        body: JSON.stringify({ status: 'APPROVED' })
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.status, 'APPROVED');
      assert.ok(json.data.publishedAt);
    }
  );

  // =========================================================================
  // 5. Public Library & Filtering
  // =========================================================================

  await t.test('GET /api/v1/notes - Public library returns approved note', async () => {
    const res = await fetch(`${baseUrl}/api/v1/notes?subjectId=${testSubject.id}`);
    assert.equal(res.status, 200);
    const json = await res.json();
    const items = json.data.items || json.data.data;
    assert.ok(items.length >= 1);
    const found = items.find((n) => n.id === createdDraftId);
    assert.ok(found);
    assert.equal(found.status, 'APPROVED');
  });

  await t.test(
    'GET /api/v1/notes - Public library strictly excludes drafts and pending notes',
    async () => {
      const res = await fetch(`${baseUrl}/api/v1/notes`);
      const json = await res.json();
      const items = json.data.items || json.data.data;
      // otherStudentDraftId is DRAFT, must NOT appear in public library
      const secretDraft = items.find((n) => n.id === otherStudentDraftId);
      assert.equal(secretDraft, undefined);
    }
  );

  // =========================================================================
  // 6. User Personal Notes Dashboard
  // =========================================================================

  await t.test('GET /api/v1/users/me/notes - Returns author notes with status filter', async () => {
    const res = await fetch(`${baseUrl}/api/v1/users/me/notes?status=APPROVED`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    const items = json.data.items || json.data.data;
    assert.ok(items.some((n) => n.id === createdDraftId));
  });

  // =========================================================================
  // 7. Archival & Cleanup
  // =========================================================================

  await t.test('POST /api/v1/notes/:id/archive - Owner can archive approved note', async () => {
    const res = await fetch(`${baseUrl}/api/v1/notes/${createdDraftId}/archive`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.data.status, 'ARCHIVED');
  });

  await t.test('DELETE /api/v1/notes/:id - Admin can delete any note', async () => {
    const res = await fetch(`${baseUrl}/api/v1/notes/${createdDraftId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);

    // Verify deletion
    const check = await prisma.note.findUnique({ where: { id: createdDraftId } });
    assert.equal(check, null);
  });
});
