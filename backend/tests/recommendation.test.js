import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'http';
import prisma from '../src/config/database.js';
import app from '../src/app.js';
import { generateAccessToken } from '../src/services/tokens/token.service.js';

test('Smart Notes Recommendation Engine Suite', async (t) => {
  let server;
  let baseUrl;

  let scholarActive;
  let scholarColdStart;
  let scholarUploader;
  let tokenActive;
  let tokenColdStart;

  let courseCS;
  let courseEE;
  let subjectAlgo;
  let subjectOS;
  let subjectCircuits;
  let categoryNotes;

  let approvedNote1;
  let approvedNote2;
  let approvedNote3;
  let pendingNote;
  let draftNote;

  t.before(async () => {
    server = createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api/v1`;

    // 1. Setup users
    scholarActive = await prisma.user.upsert({
      where: { email: 'rec_active_scholar@pjstudy.com' },
      update: {},
      create: {
        name: 'Grace Hopper',
        email: 'rec_active_scholar@pjstudy.com',
        passwordHash: '$2a$12$sampleHashForRecommendations',
        role: 'STUDENT',
        isEmailVerified: true,
        isActive: true
      }
    });

    scholarColdStart = await prisma.user.upsert({
      where: { email: 'rec_cold_scholar@pjstudy.com' },
      update: {},
      create: {
        name: 'New Scholar',
        email: 'rec_cold_scholar@pjstudy.com',
        passwordHash: '$2a$12$sampleHashForRecommendations',
        role: 'STUDENT',
        isEmailVerified: true,
        isActive: true
      }
    });

    scholarUploader = await prisma.user.upsert({
      where: { email: 'rec_uploader_scholar@pjstudy.com' },
      update: {},
      create: {
        name: 'Catalog Contributor',
        email: 'rec_uploader_scholar@pjstudy.com',
        passwordHash: '$2a$12$sampleHashForRecommendations',
        role: 'STUDENT',
        isEmailVerified: true,
        isActive: true
      }
    });

    tokenActive = generateAccessToken(scholarActive);
    tokenColdStart = generateAccessToken(scholarColdStart);

    // 2. Setup Courses, Subjects, Categories
    courseCS = await prisma.course.upsert({
      where: { slug: 'rec-course-cs' },
      update: {},
      create: {
        name: 'Computer Science Rec',
        slug: 'rec-course-cs',
        description: 'CS program for recommendations'
      }
    });

    courseEE = await prisma.course.upsert({
      where: { slug: 'rec-course-ee' },
      update: {},
      create: {
        name: 'Electrical Engineering Rec',
        slug: 'rec-course-ee',
        description: 'EE program for recommendations'
      }
    });

    subjectAlgo = await prisma.subject.upsert({
      where: { course_subject_slug_unique: { courseId: courseCS.id, slug: 'rec-algo' } },
      update: {},
      create: {
        courseId: courseCS.id,
        name: 'Algorithms & Data Structures',
        slug: 'rec-algo',
        semester: 3
      }
    });

    subjectOS = await prisma.subject.upsert({
      where: { course_subject_slug_unique: { courseId: courseCS.id, slug: 'rec-os' } },
      update: {},
      create: {
        courseId: courseCS.id,
        name: 'Operating Systems',
        slug: 'rec-os',
        semester: 4
      }
    });

    subjectCircuits = await prisma.subject.upsert({
      where: { course_subject_slug_unique: { courseId: courseEE.id, slug: 'rec-circuits' } },
      update: {},
      create: {
        courseId: courseEE.id,
        name: 'Digital Circuits',
        slug: 'rec-circuits',
        semester: 2
      }
    });

    categoryNotes = await prisma.category.upsert({
      where: { slug: 'rec-lecture-notes' },
      update: {},
      create: {
        name: 'Recommendation Lecture Notes',
        slug: 'rec-lecture-notes'
      }
    });

    // Clean up stale test data
    await prisma.downloadHistory.deleteMany({
      where: { userId: { in: [scholarActive.id, scholarColdStart.id] } }
    });
    await prisma.bookmark.deleteMany({
      where: { userId: { in: [scholarActive.id, scholarColdStart.id] } }
    });
    await prisma.note.deleteMany({
      where: {
        slug: {
          in: [
            'rec-approved-dsa-trees',
            'rec-approved-os-paging',
            'rec-approved-ee-logic',
            'rec-pending-dsa-graph',
            'rec-draft-os-kernel'
          ]
        }
      }
    });

    // 3. Create Notes with varying statuses
    approvedNote1 = await prisma.note.create({
      data: {
        title: 'Binary Trees and Heaps',
        slug: 'rec-approved-dsa-trees',
        description: 'Comprehensive binary trees and heap sort implementation notes',
        courseId: courseCS.id,
        subjectId: subjectAlgo.id,
        categoryId: categoryNotes.id,
        uploadedById: scholarUploader.id,
        semester: 3,
        status: 'APPROVED',
        viewCount: 120,
        downloadCount: 35,
        publishedAt: new Date(Date.now() - 3600000)
      }
    });

    approvedNote2 = await prisma.note.create({
      data: {
        title: 'Virtual Memory and Paging',
        slug: 'rec-approved-os-paging',
        description: 'Complete memory management notes with TLB and page replacement',
        courseId: courseCS.id,
        subjectId: subjectOS.id,
        categoryId: categoryNotes.id,
        uploadedById: scholarUploader.id,
        semester: 4,
        status: 'APPROVED',
        viewCount: 80,
        downloadCount: 20,
        publishedAt: new Date(Date.now() - 7200000)
      }
    });

    approvedNote3 = await prisma.note.create({
      data: {
        title: 'Digital Logic Gates & Boolean Algebra',
        slug: 'rec-approved-ee-logic',
        description: 'Digital circuits fundamentals and Karnaugh maps',
        courseId: courseEE.id,
        subjectId: subjectCircuits.id,
        categoryId: categoryNotes.id,
        uploadedById: scholarUploader.id,
        semester: 2,
        status: 'APPROVED',
        viewCount: 45,
        downloadCount: 8,
        publishedAt: new Date(Date.now() - 14400000)
      }
    });

    pendingNote = await prisma.note.create({
      data: {
        title: 'Graph Traversal & Dijkstra (Pending)',
        slug: 'rec-pending-dsa-graph',
        description: 'Draft notes on graph traversal under review',
        courseId: courseCS.id,
        subjectId: subjectAlgo.id,
        categoryId: categoryNotes.id,
        uploadedById: scholarUploader.id,
        semester: 3,
        status: 'PENDING_REVIEW'
      }
    });

    draftNote = await prisma.note.create({
      data: {
        title: 'OS Kernel Development (Draft)',
        slug: 'rec-draft-os-kernel',
        description: 'Unpublished draft notes',
        courseId: courseCS.id,
        subjectId: subjectOS.id,
        categoryId: categoryNotes.id,
        uploadedById: scholarUploader.id,
        semester: 4,
        status: 'DRAFT'
      }
    });

    // 4. Setup signals for scholarActive:
    // Downloaded note1 (Algorithms, semester 3, courseCS)
    await prisma.downloadHistory.create({
      data: {
        userId: scholarActive.id,
        noteId: approvedNote1.id
      }
    });

    // Bookmarked note1
    await prisma.bookmark.create({
      data: {
        userId: scholarActive.id,
        noteId: approvedNote1.id
      }
    });
  });

  t.after(async () => {
    // Cleanup
    await prisma.downloadHistory.deleteMany({
      where: { userId: { in: [scholarActive.id, scholarColdStart.id, scholarUploader.id] } }
    });
    await prisma.bookmark.deleteMany({
      where: { userId: { in: [scholarActive.id, scholarColdStart.id, scholarUploader.id] } }
    });
    await prisma.note.deleteMany({
      where: {
        slug: {
          in: [
            'rec-approved-dsa-trees',
            'rec-approved-os-paging',
            'rec-approved-ee-logic',
            'rec-pending-dsa-graph',
            'rec-draft-os-kernel'
          ]
        }
      }
    });
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  await t.test(
    '1. Authentication Gate: GET /recommendations/notes requires authentication',
    async () => {
      const res = await fetch(`${baseUrl}/recommendations/notes`);
      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert.strictEqual(body.success, false);
    }
  );

  await t.test(
    '2. Personalized Recommendations: returns scored notes with explainable reasons',
    async () => {
      const res = await fetch(`${baseUrl}/recommendations/notes?limit=5`, {
        headers: { Authorization: `Bearer ${tokenActive}` }
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.personalized, true);
      assert.strictEqual(body.data.fallback, false);
      assert.ok(Array.isArray(body.data.recommendations));

      // Must not recommend pending or draft notes
      const returnedIds = body.data.recommendations.map((r) => r.note.id);
      assert.ok(!returnedIds.includes(pendingNote.id), 'Pending notes must never be recommended');
      assert.ok(!returnedIds.includes(draftNote.id), 'Draft notes must never be recommended');

      // Each recommendation must have explainable reason and positive score
      for (const item of body.data.recommendations) {
        assert.ok(typeof item.reason === 'string' && item.reason.length > 0);
        assert.ok(typeof item.score === 'number');
        assert.strictEqual(item.note.status, 'APPROVED');
      }
    }
  );

  await t.test(
    '3. Cold-Start Fallback: returns popular notes when scholar has 0 signals',
    async () => {
      const res = await fetch(`${baseUrl}/recommendations/notes?limit=4`, {
        headers: { Authorization: `Bearer ${tokenColdStart}` }
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.personalized, false);
      assert.strictEqual(body.data.fallback, true);
      assert.ok(body.data.message.includes('personalize your academic recommendations'));
      assert.ok(body.data.recommendations.length > 0);

      for (const item of body.data.recommendations) {
        assert.strictEqual(item.note.status, 'APPROVED');
        assert.ok(typeof item.reason === 'string');
      }
    }
  );

  await t.test(
    '4. Similar Notes: GET /recommendations/notes/similar/:noteId excludes target note',
    async () => {
      const res = await fetch(`${baseUrl}/recommendations/notes/similar/${approvedNote1.id}`);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.targetNoteId, approvedNote1.id);
      assert.ok(Array.isArray(body.data.similarNotes));

      // Target note must NOT be in similarNotes
      const ids = body.data.similarNotes.map((s) => s.note.id);
      assert.ok(
        !ids.includes(approvedNote1.id),
        'Target note must be excluded from its own similar notes'
      );

      for (const sim of body.data.similarNotes) {
        assert.strictEqual(sim.note.status, 'APPROVED');
        assert.ok(typeof sim.reason === 'string');
        assert.ok(sim.score > 0);
      }
    }
  );

  await t.test('5. Similar Notes with non-existent note returns 404', async () => {
    const res = await fetch(`${baseUrl}/recommendations/notes/similar/non-existent-uuid`);
    assert.strictEqual(res.status, 404);
  });

  await t.test(
    '6. Subject-based Recommendations: GET /recommendations/notes/subjects',
    async () => {
      const res = await fetch(`${baseUrl}/recommendations/notes/subjects?limit=5`, {
        headers: { Authorization: `Bearer ${tokenActive}` }
      });
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.hasSubjects, true);
      assert.ok(Array.isArray(body.data.recommendations));
    }
  );

  await t.test('7. Public Discovery: GET /recommendations/notes/popular and /recent', async () => {
    const popRes = await fetch(`${baseUrl}/recommendations/notes/popular?limit=4`);
    assert.strictEqual(popRes.status, 200);
    const popBody = await popRes.json();
    assert.strictEqual(popBody.success, true);
    assert.ok(popBody.data.recommendations.length > 0);

    const recRes = await fetch(`${baseUrl}/recommendations/notes/recent?limit=4`);
    assert.strictEqual(recRes.status, 200);
    const recBody = await recRes.json();
    assert.strictEqual(recBody.success, true);
    assert.ok(recBody.data.recommendations.length > 0);
  });

  t.after(async () => {
    await prisma.bookmark.deleteMany({
      where: { user: { email: { contains: 'rec-test' } } }
    });
    await prisma.downloadHistory.deleteMany({
      where: { user: { email: { contains: 'rec-test' } } }
    });
    await prisma.note.deleteMany({
      where: { uploadedBy: { email: { contains: 'rec-test' } } }
    });
    await prisma.subject.deleteMany({
      where: { slug: { in: ['rec-algo', 'rec-os', 'rec-circuits'] } }
    });
    await prisma.course.deleteMany({
      where: { slug: { in: ['rec-course-cs', 'rec-course-ee'] } }
    });
    await prisma.category.deleteMany({
      where: { slug: { in: ['rec-cat-notes', 'rec-cat-exam'] } }
    });
    await prisma.user.deleteMany({
      where: { email: { contains: 'rec-test' } }
    });
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});
