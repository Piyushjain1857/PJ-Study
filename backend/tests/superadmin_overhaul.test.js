import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'http';
import prisma from '../src/config/database.js';
import app from '../src/app.js';
import { generateAccessToken } from '../src/services/tokens/token.service.js';

test('PJ Study Super Admin Experience Overhaul & RBAC Verification Suite', async (t) => {
  let server;
  let baseUrl;

  let scholarUser;
  let moderatorUser;
  let superAdminUser;

  let scholarToken;
  let moderatorToken;
  let superAdminToken;

  let testCourse;
  let testSubject;
  let testCategory;
  let approvedNote;
  let pendingNote;

  t.before(async () => {
    server = createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api/v1`;

    // 1. Create or upsert test actors
    scholarUser = await prisma.user.upsert({
      where: { email: 'overhaul_scholar@pjstudy.com' },
      update: { role: 'STUDENT', isActive: true },
      create: {
        name: 'Scholar User',
        email: 'overhaul_scholar@pjstudy.com',
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLM',
        role: 'STUDENT',
        isActive: true,
        isEmailVerified: true
      }
    });

    moderatorUser = await prisma.user.upsert({
      where: { email: 'overhaul_mod@pjstudy.com' },
      update: { role: 'MODERATOR', isActive: true },
      create: {
        name: 'Academic Moderator',
        email: 'overhaul_mod@pjstudy.com',
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLM',
        role: 'MODERATOR',
        isActive: true,
        isEmailVerified: true
      }
    });

    superAdminUser = await prisma.user.upsert({
      where: { email: 'overhaul_superadmin@pjstudy.com' },
      update: { role: 'SUPER_ADMIN', isActive: true },
      create: {
        name: 'Platform Super Admin',
        email: 'overhaul_superadmin@pjstudy.com',
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLM',
        role: 'SUPER_ADMIN',
        isActive: true,
        isEmailVerified: true
      }
    });

    scholarToken = generateAccessToken(scholarUser);
    moderatorToken = generateAccessToken(moderatorUser);
    superAdminToken = generateAccessToken(superAdminUser);

    // 2. Setup Academic Taxonomy
    testCourse = await prisma.course.upsert({
      where: { slug: 'overhaul-test-course' },
      update: {},
      create: {
        name: 'Overhaul Engineering Course',
        slug: 'overhaul-test-course',
        description: 'Test course for overhaul test suite'
      }
    });

    testSubject = await prisma.subject.upsert({
      where: {
        course_subject_slug_unique: {
          courseId: testCourse.id,
          slug: 'overhaul-test-subject'
        }
      },
      update: {},
      create: {
        courseId: testCourse.id,
        name: 'Systems Architecture',
        slug: 'overhaul-test-subject',
        semester: 3
      }
    });

    testCategory = await prisma.category.upsert({
      where: { slug: 'overhaul-test-cat' },
      update: {},
      create: {
        name: 'Overhaul Notes Category',
        slug: 'overhaul-test-cat'
      }
    });

    // 3. Setup Notes
    await prisma.note.deleteMany({
      where: {
        OR: [
          { uploadedById: { in: [scholarUser.id, moderatorUser.id, superAdminUser.id] } },
          { slug: { in: ['overhaul-approved-note', 'overhaul-pending-note'] } },
          { storageKey: { in: ['overhaul-sample.pdf', 'overhaul-pending.pdf'] } }
        ]
      }
    });

    approvedNote = await prisma.note.create({
      data: {
        title: 'Approved Systems Architecture Notes',
        slug: 'overhaul-approved-note',
        content: 'Verified peer-reviewed course manuscript.',
        status: 'APPROVED',
        courseId: testCourse.id,
        subjectId: testSubject.id,
        categoryId: testCategory.id,
        uploadedById: moderatorUser.id,
        semester: 3,
        storageKey: 'overhaul-sample.pdf',
        fileName: 'overhaul-sample.pdf',
        fileSize: 4096,
        publishedAt: new Date()
      }
    });

    pendingNote = await prisma.note.create({
      data: {
        title: 'Pending Systems Note',
        slug: 'overhaul-pending-note',
        content: 'Draft note in moderation review.',
        status: 'PENDING',
        courseId: testCourse.id,
        subjectId: testSubject.id,
        categoryId: testCategory.id,
        uploadedById: moderatorUser.id,
        semester: 3,
        storageKey: 'overhaul-pending.pdf',
        fileName: 'overhaul-pending.pdf',
        fileSize: 2048
      }
    });
  });

  t.after(async () => {
    await prisma.note.deleteMany({
      where: {
        OR: [
          { uploadedById: { in: [scholarUser.id, moderatorUser.id, superAdminUser.id] } },
          { slug: { in: ['overhaul-approved-note', 'overhaul-pending-note'] } }
        ]
      }
    });
    await prisma.subject.deleteMany({
      where: { slug: 'overhaul-test-subject' }
    });
    await prisma.course.deleteMany({
      where: { slug: 'overhaul-test-course' }
    });
    await prisma.category.deleteMany({
      where: { slug: 'overhaul-test-cat' }
    });
    await prisma.user.deleteMany({
      where: { email: { in: ['overhaul_scholar@pjstudy.com', 'overhaul_mod@pjstudy.com', 'overhaul_superadmin@pjstudy.com'] } }
    });
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // 1. Scholar Upload Forbidden
  await t.test('1. RBAC Guard: Scholar cannot upload notes (HTTP 403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/notes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${scholarToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Scholar Attempted Note Upload',
        courseId: testCourse.id,
        subjectId: testSubject.id,
        categoryId: testCategory.id,
        semester: 3
      })
    });
    assert.equal(res.status, 403);
  });

  // 2. Scholar can download approved notes
  await t.test('2. Scholar can access download endpoint for approved note', async () => {
    const res = await fetch(`${baseUrl}/notes/${approvedNote.id}/download`, {
      headers: { Authorization: `Bearer ${scholarToken}` }
    });
    // File exists on disk or 404 (file missing in dev), but MUST NOT be 403 forbidden or 401 unauth
    assert.notEqual(res.status, 401);
    assert.notEqual(res.status, 403);
  });

  // 3. Moderator CAN upload notes
  await t.test('3. Moderator CAN upload notes (HTTP 201 Created)', async () => {
    const res = await fetch(`${baseUrl}/notes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${moderatorToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Moderator Uploaded Manuscript',
        courseId: testCourse.id,
        subjectId: testSubject.id,
        categoryId: testCategory.id,
        semester: 3,
        content: 'Legitimate study notes contributed by verified moderator'
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    if (body.data?.id) {
      await prisma.note.delete({ where: { id: body.data.id } }).catch(() => {});
    }
  });

  // 4. Moderator cannot access Super Admin endpoints
  await t.test('4. Moderator cannot access Super Admin-only endpoints (HTTP 403 Forbidden)', async () => {
    const endpoints = [
      '/admin/overview',
      '/admin/users',
      '/admin/moderators',
      '/admin/notes',
      '/admin/settings'
    ];

    for (const ep of endpoints) {
      const res = await fetch(`${baseUrl}${ep}`, {
        headers: { Authorization: `Bearer ${moderatorToken}` }
      });
      assert.equal(res.status, 403, `Moderator must be blocked from ${ep}`);
    }
  });

  // 5. Super Admin can access Command Overview with genuine database metrics
  await t.test('5. Super Admin GET /admin/overview returns 8 genuine database metrics', async () => {
    const res = await fetch(`${baseUrl}/admin/overview`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);

    const d = body.data;
    assert.equal(typeof d.totalUsers, 'number');
    assert.equal(typeof d.activeUsers, 'number');
    assert.equal(typeof d.activeScholars, 'number');
    assert.equal(typeof d.activeModerators, 'number');
    assert.equal(typeof d.totalNotes, 'number');
    assert.equal(typeof d.approvedNotes, 'number');
    assert.equal(typeof d.pendingModeration, 'number');
    assert.equal(typeof d.totalDownloads, 'number');
    assert.equal(typeof d.reportedContent, 'number');
    assert.ok(d.roles);
  });

  // 6. Super Admin can access System Health diagnostics
  await t.test('6. Super Admin GET /admin/health returns DB latency and system status', async () => {
    const res = await fetch(`${baseUrl}/admin/health`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'HEALTHY');
    assert.equal(body.data.database.status, 'CONNECTED');
    assert.equal(typeof body.data.database.latencyMs, 'number');
    assert.ok(body.data.server.uptimeSeconds >= 0);
  });

  // 7. Super Admin can access Storage Stats
  await t.test('7. Super Admin GET /admin/storage returns disk and files metadata', async () => {
    const res = await fetch(`${baseUrl}/admin/storage`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(typeof body.data.totalStoredManuscripts, 'number');
    assert.equal(typeof body.data.totalStorageBytes, 'number');
    assert.ok(Array.isArray(body.data.allowedMimeTypes));
  });

  // 8. Super Admin can access Backup Status
  await t.test('8. Super Admin GET /admin/backups returns snapshot readiness checklist', async () => {
    const res = await fetch(`${baseUrl}/admin/backups`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'READY');
    assert.ok(Array.isArray(body.data.snapshotChecklist));
    assert.ok(body.data.tablesSummary);
  });

  // 9. Super Admin can access Live Activity Stream
  await t.test('9. Super Admin GET /admin/activity returns recent audit trail stream', async () => {
    const res = await fetch(`${baseUrl}/admin/activity?limit=10`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
  });

  // 10. Super Admin can approve and reject notes
  await t.test('10. Super Admin can approve pending manuscripts via POST /notes/:id/review', async () => {
    const res = await fetch(`${baseUrl}/notes/${pendingNote.id}/review`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ decision: 'APPROVE' })
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
  });
});
