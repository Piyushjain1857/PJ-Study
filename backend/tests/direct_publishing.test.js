import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'http';
import prisma from '../src/config/database.js';
import app from '../src/app.js';
import { generateAccessToken } from '../src/services/tokens/token.service.js';

test('PJ Study Direct Publishing & Workflow Removal Suite', async (t) => {
  let server;
  let baseUrl;

  let scholarUser;
  let adminUser;
  let superAdminUser;

  let scholarToken;
  let adminToken;
  let superAdminToken;

  let testCourse;
  let testSubject;
  let testCategory;

  let createdNoteId;
  let superAdminNoteId;

  t.before(async () => {
    server = createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api/v1`;

    scholarUser = await prisma.user.upsert({
      where: { email: 'pub_scholar@pjstudy.com' },
      update: { role: 'STUDENT', isActive: true },
      create: {
        name: 'Publishing Scholar',
        email: 'pub_scholar@pjstudy.com',
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLM',
        role: 'STUDENT',
        isActive: true,
        isEmailVerified: true
      }
    });

    adminUser = await prisma.user.upsert({
      where: { email: 'pub_admin@pjstudy.com' },
      update: { role: 'ADMIN', isActive: true },
      create: {
        name: 'Publishing Admin',
        email: 'pub_admin@pjstudy.com',
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLM',
        role: 'ADMIN',
        isActive: true,
        isEmailVerified: true
      }
    });

    superAdminUser = await prisma.user.upsert({
      where: { email: 'pub_superadmin@pjstudy.com' },
      update: { role: 'SUPER_ADMIN', isActive: true },
      create: {
        name: 'Publishing Super Admin',
        email: 'pub_superadmin@pjstudy.com',
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLM',
        role: 'SUPER_ADMIN',
        isActive: true,
        isEmailVerified: true
      }
    });

    testCourse = await prisma.course.upsert({
      where: { slug: 'pub-cs101' },
      update: { semestersCount: 6, isActive: true },
      create: {
        name: 'Direct Publishing Course',
        code: 'PUB-CS101',
        slug: 'pub-cs101',
        semestersCount: 6,
        isActive: true
      }
    });

    testSubject = await prisma.subject.upsert({
      where: {
        course_subject_slug_unique: {
          courseId: testCourse.id,
          slug: 'pub-sub101'
        }
      },
      update: { semester: 2 },
      create: {
        name: 'Direct Publishing Subject',
        slug: 'pub-sub101',
        code: 'PUB-SUB101',
        courseId: testCourse.id,
        semester: 2
      }
    });

    testCategory = await prisma.category.upsert({
      where: { slug: 'pub-cat' },
      update: {},
      create: {
        name: 'Publishing Category',
        slug: 'pub-cat'
      }
    });

    scholarToken = generateAccessToken(scholarUser);
    adminToken = generateAccessToken(adminUser);
    superAdminToken = generateAccessToken(superAdminUser);
  });

  t.after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    // Cleanup notes
    if (createdNoteId || superAdminNoteId) {
      await prisma.note.deleteMany({
        where: { id: { in: [createdNoteId, superAdminNoteId].filter(Boolean) } }
      });
    }
  });

  // 1. Scholar cannot upload notes
  await t.test('1. RBAC Guard: Scholar cannot upload notes (HTTP 403)', async () => {
    const res = await fetch(`${baseUrl}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${scholarToken}`
      },
      body: JSON.stringify({
        title: 'Unauthorized Scholar Note',
        courseId: testCourse.id,
        subjectId: testSubject.id,
        categoryId: testCategory.id,
        semester: 2,
        content: 'This should fail.'
      })
    });
    assert.equal(res.status, 403);
  });

  // 2. Admin uploads note -> publishes directly and immediately
  await t.test('2. Direct Publishing: Admin note uploads publish immediately as PUBLISHED', async () => {
    const res = await fetch(`${baseUrl}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Advanced Operating Systems Notes',
        description: 'Comprehensive OS notes for semester 2',
        courseId: testCourse.id,
        subjectId: testSubject.id,
        categoryId: testCategory.id,
        semester: 2,
        content: 'Virtual memory paging algorithms and synchronization primitives.'
      })
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'PUBLISHED');
    assert.ok(body.data.publishedAt, 'publishedAt must be set immediately');
    createdNoteId = body.data.id;
  });

  // 3. Super Admin uploads note -> publishes directly and immediately
  await t.test('3. Direct Publishing: Super Admin note uploads publish immediately as PUBLISHED', async () => {
    const res = await fetch(`${baseUrl}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        title: 'Distributed Systems & Consensus',
        description: 'Paxos and Raft consensus guide',
        courseId: testCourse.id,
        subjectId: testSubject.id,
        categoryId: testCategory.id,
        semester: 2,
        content: 'Consensus mechanisms in distributed systems.'
      })
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'PUBLISHED');
    assert.ok(body.data.publishedAt, 'publishedAt must be set immediately');
    superAdminNoteId = body.data.id;
  });

  // 4. Note is immediately visible to Scholars in public search and explore
  await t.test('4. Scholar Discovery: Published note appears immediately in public catalog', async () => {
    const res = await fetch(`${baseUrl}/notes?search=Operating+Systems`);
    assert.equal(res.status, 200);
    const body = await res.json();
    const items = body.data.items || body.data.data;
    const found = items.find((n) => n.id === createdNoteId);
    assert.ok(found, 'Newly uploaded note must be immediately discoverable');
    assert.equal(found.status, 'PUBLISHED');
  });

  // 5. Admin can unpublish note
  await t.test('5. Lifecycle: Admin unpublishes note via PATCH /notes/:id/unpublish', async () => {
    const res = await fetch(`${baseUrl}/notes/${createdNoteId}/unpublish`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'UNPUBLISHED');
  });

  // 6. Unpublished note is hidden from Scholar explore/search
  await t.test('6. Content Visibility: Unpublished note is hidden from public catalog', async () => {
    const res = await fetch(`${baseUrl}/notes?search=Operating+Systems`);
    assert.equal(res.status, 200);
    const body = await res.json();
    const items = body.data.items || body.data.data;
    const found = items.find((n) => n.id === createdNoteId);
    assert.ok(!found, 'Unpublished note must not appear in public catalog');
  });

  // 7. Scholar cannot download unpublished note (HTTP 403)
  await t.test('7. Protected File Access: Scholar cannot download unpublished note (HTTP 403)', async () => {
    const res = await fetch(`${baseUrl}/notes/${createdNoteId}/download`, {
      headers: { Authorization: `Bearer ${scholarToken}` }
    });
    assert.equal(res.status, 403);
  });

  // 8. Admin can re-publish note
  await t.test('8. Lifecycle: Admin re-publishes note via PATCH /notes/:id/publish', async () => {
    const res = await fetch(`${baseUrl}/notes/${createdNoteId}/publish`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'PUBLISHED');
  });

  // 9. Scholar can now access re-published note
  await t.test('9. Scholar Access: Scholar can access re-published note again', async () => {
    const res = await fetch(`${baseUrl}/notes/${createdNoteId}`, {
      headers: { Authorization: `Bearer ${scholarToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.id, createdNoteId);
    assert.equal(body.data.status, 'PUBLISHED');
  });

  // 10. Admin workspace notes endpoint returns filtered notes
  await t.test('10. Admin Workspace: GET /admin-workspace/notes filters by PUBLISHED & UNPUBLISHED', async () => {
    const resPub = await fetch(`${baseUrl}/admin-workspace/notes?status=PUBLISHED`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(resPub.status, 200);
    const pubBody = await resPub.json();
    assert.equal(pubBody.success, true);
    assert.ok(pubBody.data.notes.some((n) => n.id === createdNoteId));

    const resUnpub = await fetch(`${baseUrl}/admin-workspace/notes?status=UNPUBLISHED`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(resUnpub.status, 200);
    const unpubBody = await resUnpub.json();
    assert.equal(unpubBody.success, true);
    assert.ok(!unpubBody.data.notes.some((n) => n.id === createdNoteId));
  });
});
