import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'http';
import prisma from '../src/config/database.js';
import app from '../src/app.js';
import { generateAccessToken } from '../src/services/tokens/token.service.js';

test('Scholar Study Library & Bookmarks API Verification Suite', async (t) => {
  let server;
  let baseUrl;

  let scholarUser;
  let adminUser;

  let scholarToken;
  let adminToken;

  let testCourse;
  let testSubject;
  let testCategory;
  let testNote;

  t.before(async () => {
    server = createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api/v1`;

    scholarUser = await prisma.user.upsert({
      where: { email: 'library_scholar@pjstudy.com' },
      update: { role: 'STUDENT', isActive: true },
      create: {
        name: 'Library Scholar',
        email: 'library_scholar@pjstudy.com',
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLM',
        role: 'STUDENT',
        isActive: true,
        isEmailVerified: true
      }
    });

    adminUser = await prisma.user.upsert({
      where: { email: 'library_admin@pjstudy.com' },
      update: { role: 'ADMIN', isActive: true },
      create: {
        name: 'Library Admin',
        email: 'library_admin@pjstudy.com',
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLM',
        role: 'ADMIN',
        isActive: true,
        isEmailVerified: true
      }
    });

    testCourse = await prisma.course.upsert({
      where: { slug: 'lib-cs101' },
      update: { semestersCount: 8, isActive: true },
      create: {
        name: 'Library Computer Science',
        code: 'LIB-CS101',
        slug: 'lib-cs101',
        semestersCount: 8,
        isActive: true
      }
    });

    testSubject = await prisma.subject.upsert({
      where: {
        course_subject_slug_unique: {
          courseId: testCourse.id,
          slug: 'lib-dsa'
        }
      },
      update: { semester: 3 },
      create: {
        name: 'Data Structures & Algorithms',
        slug: 'lib-dsa',
        code: 'LIB-DSA301',
        courseId: testCourse.id,
        semester: 3
      }
    });

    testCategory = await prisma.category.upsert({
      where: { slug: 'lib-cat' },
      update: {},
      create: {
        name: 'Library Category',
        slug: 'lib-cat'
      }
    });

    testNote = await prisma.note.create({
      data: {
        title: 'Binary Trees and Heap Algorithms',
        slug: 'lib-dsa-trees-note',
        description: 'Complete traversal algorithms and heap sort notes.',
        status: 'PUBLISHED',
        publishedAt: new Date(),
        courseId: testCourse.id,
        subjectId: testSubject.id,
        categoryId: testCategory.id,
        uploadedById: adminUser.id,
        semester: 3,
        content: 'Binary Search Tree invariants, balancing rotations and min-heap implementation.'
      }
    });

    scholarToken = generateAccessToken(scholarUser);
    adminToken = generateAccessToken(adminUser);
  });

  t.after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    // Cleanup bookmark & note
    if (scholarUser && testNote) {
      await prisma.bookmark.deleteMany({
        where: { userId: scholarUser.id }
      });
      await prisma.note.deleteMany({
        where: { id: testNote.id }
      });
    }
  });

  // 1. Unauthenticated request to /notes/bookmarks must fail with 401
  await t.test('1. Security Guard: GET /notes/bookmarks requires authentication (HTTP 401)', async () => {
    const res = await fetch(`${baseUrl}/notes/bookmarks`);
    assert.equal(res.status, 401);
  });

  // 2. Scholar can bookmark a note via POST /notes/:id/bookmark
  await t.test('2. Scholar can bookmark a published note (HTTP 200)', async () => {
    const res = await fetch(`${baseUrl}/notes/${testNote.id}/bookmark`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${scholarToken}`
      }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.bookmarked, true);
  });

  // 3. Scholar can retrieve bookmarked notes via GET /notes/bookmarks
  await t.test('3. Scholar can retrieve their saved library notes via GET /notes/bookmarks (HTTP 200)', async () => {
    const res = await fetch(`${baseUrl}/notes/bookmarks`, {
      headers: {
        Authorization: `Bearer ${scholarToken}`
      }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.items), 'data.items must be an array');
    assert.ok(body.data.items.length >= 1, 'Must contain at least 1 bookmarked note');
    assert.equal(body.data.items[0].id, testNote.id);
    assert.equal(body.data.items[0].title, testNote.title);
  });

  // 4. Scholar can remove bookmark via DELETE /notes/:id/bookmark
  await t.test('4. Scholar can remove a bookmark via DELETE /notes/:id/bookmark (HTTP 200)', async () => {
    const res = await fetch(`${baseUrl}/notes/${testNote.id}/bookmark`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${scholarToken}`
      }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.bookmarked, false);
  });

  // 5. GET /notes/bookmarks reflects removed bookmark
  await t.test('5. GET /notes/bookmarks reflects empty list after removing bookmark', async () => {
    const res = await fetch(`${baseUrl}/notes/bookmarks`, {
      headers: {
        Authorization: `Bearer ${scholarToken}`
      }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    const match = body.data.items.find((n) => n.id === testNote.id);
    assert.equal(match, undefined, 'Note should no longer be in bookmarked list');
  });

  // 6. RBAC Guard: Scholar cannot upload notes
  await t.test('6. RBAC Guard: Scholar cannot upload notes (HTTP 403 Forbidden)', async () => {
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
        semester: 3,
        content: 'Should be rejected.'
      })
    });
    assert.equal(res.status, 403);
  });
});
