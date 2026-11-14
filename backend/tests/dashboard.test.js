import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'http';
import prisma from '../src/config/database.js';
import app from '../src/app.js';
import { generateAccessToken } from '../src/services/tokens/token.service.js';

test('Student Dashboard & Personalized Learning Analytics Suite', async (t) => {
  let server;
  let baseUrl;

  let studentA;
  let studentB;
  let tokenA;
  let tokenB;

  let testCourse;
  let testSubject;
  let testCategory;
  let approvedNote;
  let studentANote;

  t.before(async () => {
    server = createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api/v1`;

    // 1. Setup Student A and Student B
    studentA = await prisma.user.upsert({
      where: { email: 'dash_student_a@pjstudy.com' },
      update: {},
      create: {
        name: 'Alex Rivera',
        email: 'dash_student_a@pjstudy.com',
        passwordHash: '$2a$12$eInFw.sampleHash',
        role: 'STUDENT',
        isEmailVerified: true,
        isActive: true
      }
    });

    studentB = await prisma.user.upsert({
      where: { email: 'dash_student_b@pjstudy.com' },
      update: {},
      create: {
        name: 'Blake Chen',
        email: 'dash_student_b@pjstudy.com',
        passwordHash: '$2a$12$eInFw.sampleHash',
        role: 'STUDENT',
        isEmailVerified: true,
        isActive: true
      }
    });

    tokenA = generateAccessToken(studentA);
    tokenB = generateAccessToken(studentB);

    // 2. Setup Course, Subject, Category
    testCourse = await prisma.course.upsert({
      where: { slug: 'dash-cs-course' },
      update: {},
      create: {
        name: 'Computer Science Analytics',
        slug: 'dash-cs-course',
        description: 'Test program for dashboard analytics'
      }
    });

    testSubject = await prisma.subject.upsert({
      where: { course_subject_slug_unique: { courseId: testCourse.id, slug: 'dash-algorithms' } },
      update: {},
      create: {
        courseId: testCourse.id,
        name: 'Algorithms & Data Structures',
        slug: 'dash-algorithms',
        semester: 3
      }
    });

    testCategory = await prisma.category.upsert({
      where: { slug: 'dash-lecture-notes' },
      update: {},
      create: {
        name: 'Dashboard Lecture Notes',
        slug: 'dash-lecture-notes'
      }
    });

    // Clean up any stale test notes first
    await prisma.downloadHistory.deleteMany({
      where: { userId: { in: [studentA.id, studentB.id] } }
    });
    await prisma.studyCollectionItem.deleteMany({
      where: { collection: { userId: { in: [studentA.id, studentB.id] } } }
    });
    await prisma.studyCollection.deleteMany({
      where: { userId: { in: [studentA.id, studentB.id] } }
    });
    await prisma.bookmark.deleteMany({
      where: { userId: { in: [studentA.id, studentB.id] } }
    });
    await prisma.note.deleteMany({
      where: { slug: { in: ['dash-approved-binary-search', 'dash-student-a-notes'] } }
    });

    // 3. Setup Notes
    approvedNote = await prisma.note.create({
      data: {
        title: 'Binary Search Algorithm Guide',
        slug: 'dash-approved-binary-search',
        description: 'Comprehensive guide to divide-and-conquer searching',
        courseId: testCourse.id,
        subjectId: testSubject.id,
        categoryId: testCategory.id,
        uploadedById: studentB.id,
        semester: 3,
        status: 'APPROVED',
        viewCount: 42,
        downloadCount: 15,
        publishedAt: new Date()
      }
    });

    studentANote = await prisma.note.create({
      data: {
        title: 'My Custom Graph Notes',
        slug: 'dash-student-a-notes',
        description: 'Student A uploaded notes',
        courseId: testCourse.id,
        subjectId: testSubject.id,
        categoryId: testCategory.id,
        uploadedById: studentA.id,
        semester: 3,
        status: 'APPROVED',
        viewCount: 10,
        downloadCount: 2,
        publishedAt: new Date()
      }
    });

    // 4. Setup Activity for Student A:
    // Bookmark
    await prisma.bookmark.upsert({
      where: { user_note_bookmark_unique: { userId: studentA.id, noteId: approvedNote.id } },
      update: {},
      create: {
        userId: studentA.id,
        noteId: approvedNote.id
      }
    });

    // Collection
    const collection = await prisma.studyCollection.upsert({
      where: { user_collection_name_unique: { userId: studentA.id, name: 'Midterm Prep' } },
      update: {},
      create: {
        userId: studentA.id,
        name: 'Midterm Prep',
        description: 'Key algorithms for midterm review'
      }
    });

    // Collection item
    await prisma.studyCollectionItem.upsert({
      where: { collection_note_unique: { collectionId: collection.id, noteId: approvedNote.id } },
      update: {},
      create: {
        collectionId: collection.id,
        noteId: approvedNote.id
      }
    });

    // Download history
    await prisma.downloadHistory.create({
      data: {
        userId: studentA.id,
        noteId: approvedNote.id
      }
    });
  });

  t.after(async () => {
    // Cleanup created test records
    await prisma.downloadHistory.deleteMany({
      where: { userId: { in: [studentA.id, studentB.id] } }
    });
    await prisma.studyCollectionItem.deleteMany({
      where: { noteId: { in: [approvedNote.id, studentANote.id] } }
    });
    await prisma.studyCollection.deleteMany({
      where: { userId: { in: [studentA.id, studentB.id] } }
    });
    await prisma.bookmark.deleteMany({
      where: { userId: { in: [studentA.id, studentB.id] } }
    });
    await prisma.note.deleteMany({
      where: { id: { in: [approvedNote.id, studentANote.id] } }
    });

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  await t.test('1. Unauthorized requests should be rejected with 401', async () => {
    const res = await fetch(`${baseUrl}/dashboard/overview`);
    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.success, false);
  });

  await t.test('2. Student A overview should reflect real database counts', async () => {
    const res = await fetch(`${baseUrl}/dashboard/overview`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);
    assert.ok(json.data);

    const {
      stats,
      recentBookmarks,
      recentUploads,
      recentCollections,
      recentDownloads,
      recommendedNotes
    } = json.data;

    // Verify stats
    assert.equal(stats.savedNotes >= 1, true, 'Saved notes count should be at least 1');
    assert.equal(stats.collections >= 1, true, 'Collections count should be at least 1');
    assert.equal(stats.downloads >= 1, true, 'Downloads count should be at least 1');
    assert.equal(
      stats.uniqueNotesDownloaded >= 1,
      true,
      'Unique notes downloaded should be at least 1'
    );
    assert.equal(stats.uploads >= 1, true, 'Student A uploads count should be at least 1');

    // Verify recent lists
    assert.equal(recentBookmarks.length >= 1, true);
    assert.equal(recentBookmarks[0].note.title, 'Binary Search Algorithm Guide');

    assert.equal(recentUploads.length >= 1, true);
    assert.equal(recentUploads[0].title, 'My Custom Graph Notes');

    assert.equal(recentCollections.length >= 1, true);
    assert.equal(recentCollections[0].name, 'Midterm Prep');
    assert.equal(recentCollections[0].noteCount >= 1, true);

    assert.equal(recentDownloads.length >= 1, true);
    assert.equal(recentDownloads[0].note.title, 'Binary Search Algorithm Guide');

    assert.ok(Array.isArray(recommendedNotes));
  });

  await t.test(
    '3. Cross-user isolation: Student B should have independent counts and empty history',
    async () => {
      const res = await fetch(`${baseUrl}/dashboard/overview`, {
        headers: { Authorization: `Bearer ${tokenB}` }
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);

      const { stats, recentBookmarks, recentCollections, recentDownloads } = json.data;

      // Student B has not bookmarked or downloaded anything yet
      assert.equal(stats.savedNotes, 0);
      assert.equal(stats.collections, 0);
      assert.equal(stats.downloads, 0);
      assert.equal(recentBookmarks.length, 0);
      assert.equal(recentCollections.length, 0);
      assert.equal(recentDownloads.length, 0);
      // Student B uploaded approvedNote
      assert.equal(stats.uploads >= 1, true);
    }
  );

  await t.test('4. Analytics endpoint should return structured daily timeline for 7d', async () => {
    const res = await fetch(`${baseUrl}/dashboard/analytics?range=7d`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);

    const { range, days, startDate, endDate, totals, timeline } = json.data;
    assert.equal(range, '7d');
    assert.equal(days, 7);
    assert.ok(startDate);
    assert.ok(endDate);

    assert.equal(timeline.length, 7, 'Timeline should have exactly 7 daily points for 7d range');
    assert.equal(typeof totals.bookmarks, 'number');
    assert.equal(typeof totals.downloads, 'number');
    assert.equal(typeof totals.uploads, 'number');
    assert.equal(typeof totals.collections, 'number');
    assert.equal(typeof totals.totalEvents, 'number');

    // Each timeline item should have expected schema
    const firstPoint = timeline[0];
    assert.ok(firstPoint.date);
    assert.equal(typeof firstPoint.bookmarks, 'number');
    assert.equal(typeof firstPoint.downloads, 'number');
    assert.equal(typeof firstPoint.uploads, 'number');
    assert.equal(typeof firstPoint.collections, 'number');
  });

  await t.test('5. Analytics endpoint should support 30d and 90d ranges', async () => {
    const res30 = await fetch(`${baseUrl}/dashboard/analytics?range=30d`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const json30 = await res30.json();
    assert.equal(json30.data.range, '30d');
    assert.equal(json30.data.timeline.length, 30);

    const res90 = await fetch(`${baseUrl}/dashboard/analytics?range=90d`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    const json90 = await res90.json();
    assert.equal(json90.data.range, '90d');
    assert.equal(json90.data.timeline.length, 90);
  });

  await t.test('6. Downloads endpoint should paginate download history', async () => {
    const res = await fetch(`${baseUrl}/dashboard/downloads?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.success, true);

    const { items, pagination } = json.data;
    assert.ok(Array.isArray(items));
    assert.equal(items.length >= 1, true);
    assert.equal(pagination.page, 1);
    assert.equal(pagination.limit, 5);
    assert.equal(pagination.totalItems >= 1, true);
  });
});
