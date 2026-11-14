import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'http';
import prisma from '../src/config/database.js';
import app from '../src/app.js';
import storageService from '../src/services/storage/storage.service.js';

test('Advanced Notes Discovery, Search, Filtering & Student Library Suite', async (t) => {
  let server;
  let baseUrl;

  // Test Entities
  let testUser;
  let testCourse1;
  let testCourse2;
  let testSubject1;
  let testSubject2;
  let testCategory1;
  let testCategory2;

  let approvedNote1;
  let approvedNote2;
  let pendingNote;
  let draftNote;
  let rejectedNote;

  t.before(async () => {
    server = createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api/v1`;

    // 1. Setup author
    testUser = await prisma.user.upsert({
      where: { email: 'discovery_tester@pjstudy.com' },
      update: {},
      create: {
        name: 'Discovery Scholar',
        email: 'discovery_tester@pjstudy.com',
        passwordHash: '$2a$12$eInFw.sampleHash',
        role: 'STUDENT',
        isEmailVerified: true,
        isActive: true
      }
    });

    // 2. Setup Courses
    testCourse1 = await prisma.course.upsert({
      where: { slug: 'disc-cs-btech' },
      update: {},
      create: {
        name: 'Computer Science & Engineering',
        slug: 'disc-cs-btech',
        description: 'B.Tech CS Curriculum'
      }
    });

    testCourse2 = await prisma.course.upsert({
      where: { slug: 'disc-ee-btech' },
      update: {},
      create: {
        name: 'Electrical Engineering',
        slug: 'disc-ee-btech',
        description: 'B.Tech Electrical'
      }
    });

    // 3. Setup Subjects
    testSubject1 = await prisma.subject.upsert({
      where: {
        course_subject_slug_unique: {
          courseId: testCourse1.id,
          slug: 'disc-algorithms'
        }
      },
      update: {},
      create: {
        name: 'Design and Analysis of Algorithms',
        slug: 'disc-algorithms',
        courseId: testCourse1.id,
        semester: 4
      }
    });

    testSubject2 = await prisma.subject.upsert({
      where: {
        course_subject_slug_unique: {
          courseId: testCourse1.id,
          slug: 'disc-dbms'
        }
      },
      update: {},
      create: {
        name: 'Database Management Systems',
        slug: 'disc-dbms',
        courseId: testCourse1.id,
        semester: 3
      }
    });

    // 4. Setup Categories
    testCategory1 = await prisma.category.upsert({
      where: { slug: 'disc-lecture-notes' },
      update: {},
      create: {
        name: 'Discovery Lecture Notes',
        slug: 'disc-lecture-notes'
      }
    });

    testCategory2 = await prisma.category.upsert({
      where: { slug: 'disc-exam-solutions' },
      update: {},
      create: {
        name: 'Discovery Exam Solutions',
        slug: 'disc-exam-solutions'
      }
    });

    // 5. Create test file in storage
    const sampleBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
    const stored = await storageService.saveFile({
      originalname: 'algorithms_cheatsheet.pdf',
      buffer: sampleBuffer,
      size: sampleBuffer.length,
      mimetype: 'application/pdf'
    });

    // 6. Setup Notes with various statuses and fields
    approvedNote1 = await prisma.note.create({
      data: {
        title: 'Complete Algorithms Master Notes Dynamic Programming',
        slug: 'complete-algorithms-master-notes',
        description:
          'Comprehensive study guide for Greedy, Dynamic Programming, and Graph traversal.',
        content: 'Graph algorithms include Dijkstra, Bellman-Ford, and Floyd-Warshall.',
        courseId: testCourse1.id,
        subjectId: testSubject1.id,
        categoryId: testCategory1.id,
        semester: 4,
        academicYear: '2026',
        uploadedById: testUser.id,
        status: 'APPROVED',
        publishedAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
        fileName: 'algorithms_cheatsheet.pdf',
        storageKey: stored.storageKey,
        fileSize: BigInt(stored.fileSize),
        mimeType: stored.mimeType,
        downloadCount: 42,
        viewCount: 150
      }
    });

    approvedNote2 = await prisma.note.create({
      data: {
        title: 'Database Relational Normalization & SQL Queries',
        slug: 'database-normalization-sql',
        description: '1NF, 2NF, 3NF, BCNF decomposition guide with SQL query examples.',
        content: 'Relational algebra and relational calculus principles.',
        courseId: testCourse1.id,
        subjectId: testSubject2.id,
        categoryId: testCategory2.id,
        semester: 3,
        academicYear: '2026',
        uploadedById: testUser.id,
        status: 'APPROVED',
        publishedAt: new Date(Date.now() - 3600000 * 5), // 5 hours ago
        downloadCount: 12,
        viewCount: 65
      }
    });

    pendingNote = await prisma.note.create({
      data: {
        title: 'Pending Algorithms Advanced Notes',
        slug: 'pending-algorithms-note',
        description: 'Should never appear in public discovery.',
        courseId: testCourse1.id,
        subjectId: testSubject1.id,
        categoryId: testCategory1.id,
        semester: 4,
        uploadedById: testUser.id,
        status: 'PENDING_REVIEW'
      }
    });

    draftNote = await prisma.note.create({
      data: {
        title: 'Draft Personal Secret Syllabus Notes',
        slug: 'draft-personal-notes',
        description: 'Private draft, completely hidden from discovery.',
        courseId: testCourse1.id,
        subjectId: testSubject1.id,
        categoryId: testCategory1.id,
        semester: 4,
        uploadedById: testUser.id,
        status: 'DRAFT'
      }
    });

    rejectedNote = await prisma.note.create({
      data: {
        title: 'Rejected Low Quality Note',
        slug: 'rejected-note',
        description: 'Rejected by moderator, strictly excluded.',
        courseId: testCourse1.id,
        subjectId: testSubject1.id,
        categoryId: testCategory1.id,
        semester: 4,
        uploadedById: testUser.id,
        status: 'REJECTED',
        rejectionReason: 'Content does not meet academic standards.'
      }
    });
  });

  t.after(async () => {
    // Cleanup created test notes
    await prisma.note.deleteMany({
      where: {
        id: {
          in: [
            approvedNote1?.id,
            approvedNote2?.id,
            pendingNote?.id,
            draftNote?.id,
            rejectedNote?.id
          ].filter(Boolean)
        }
      }
    });

    await prisma.subject.deleteMany({
      where: { id: { in: [testSubject1?.id, testSubject2?.id].filter(Boolean) } }
    });
    await prisma.course.deleteMany({
      where: { id: { in: [testCourse1?.id, testCourse2?.id].filter(Boolean) } }
    });
    await prisma.category.deleteMany({
      where: { id: { in: [testCategory1?.id, testCategory2?.id].filter(Boolean) } }
    });
    await prisma.user.deleteMany({
      where: { email: 'discovery_tester@pjstudy.com' }
    });

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  await t.test('1. Public discovery returns ONLY approved notes', async () => {
    const res = await fetch(`${baseUrl}/notes/explore`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data.notes));

    const noteIds = body.data.notes.map((n) => n.id);
    assert.ok(noteIds.includes(approvedNote1.id), 'Must include approved note 1');
    assert.ok(noteIds.includes(approvedNote2.id), 'Must include approved note 2');
    assert.ok(!noteIds.includes(pendingNote.id), 'Must NOT include pending note');
    assert.ok(!noteIds.includes(draftNote.id), 'Must NOT include draft note');
    assert.ok(!noteIds.includes(rejectedNote.id), 'Must NOT include rejected note');
  });

  await t.test('2. Keyword search accurately filters notes by title and description', async () => {
    const searchRes = await fetch(`${baseUrl}/notes/explore?search=Normalization`);
    assert.strictEqual(searchRes.status, 200);
    const body = await searchRes.json();

    const ids = body.data.notes.map((n) => n.id);
    assert.ok(ids.includes(approvedNote2.id));
    assert.ok(!ids.includes(approvedNote1.id));
  });

  await t.test('3. Search by subject name matches notes linked to that subject', async () => {
    const searchRes = await fetch(`${baseUrl}/notes/explore?search=Algorithms`);
    assert.strictEqual(searchRes.status, 200);
    const body = await searchRes.json();

    const ids = body.data.notes.map((n) => n.id);
    assert.ok(ids.includes(approvedNote1.id));
  });

  await t.test('4. Academic metadata filters: subjectId and categoryId', async () => {
    const filterRes = await fetch(
      `${baseUrl}/notes/explore?subjectId=${testSubject2.id}&categoryId=${testCategory2.id}`
    );
    assert.strictEqual(filterRes.status, 200);
    const body = await filterRes.json();

    assert.strictEqual(body.data.notes.length, 1);
    assert.strictEqual(body.data.notes[0].id, approvedNote2.id);
  });

  await t.test('5. Academic metadata filter: semester filtering', async () => {
    const sem4Res = await fetch(`${baseUrl}/notes/explore?semester=4`);
    assert.strictEqual(sem4Res.status, 200);
    const body4 = await sem4Res.json();
    const ids4 = body4.data.notes.map((n) => n.id);
    assert.ok(ids4.includes(approvedNote1.id));
    assert.ok(!ids4.includes(approvedNote2.id));

    const sem3Res = await fetch(`${baseUrl}/notes/explore?semester=3`);
    assert.strictEqual(sem3Res.status, 200);
    const body3 = await sem3Res.json();
    const ids3 = body3.data.notes.map((n) => n.id);
    assert.ok(ids3.includes(approvedNote2.id));
    assert.ok(!ids3.includes(approvedNote1.id));
  });

  await t.test('6. Sorting allowlist: newest, oldest, title_asc, downloads', async () => {
    // Downloads sorting: approvedNote1 (42 downloads) should be before approvedNote2 (12 downloads)
    const downRes = await fetch(`${baseUrl}/notes/explore?sort=downloads`);
    assert.strictEqual(downRes.status, 200);
    const downBody = await downRes.json();
    const notes = downBody.data.notes.filter(
      (n) => n.id === approvedNote1.id || n.id === approvedNote2.id
    );
    assert.strictEqual(notes[0].id, approvedNote1.id);
    assert.strictEqual(notes[1].id, approvedNote2.id);

    // Title A-Z sorting: "Complete..." comes before "Database..."
    const alphaRes = await fetch(`${baseUrl}/notes/explore?sort=title_asc`);
    assert.strictEqual(alphaRes.status, 200);
    const alphaBody = await alphaRes.json();
    const alphaNotes = alphaBody.data.notes.filter(
      (n) => n.id === approvedNote1.id || n.id === approvedNote2.id
    );
    assert.strictEqual(alphaNotes[0].id, approvedNote1.id);
    assert.strictEqual(alphaNotes[1].id, approvedNote2.id);
  });

  await t.test('7. Pagination: respects limit and page parameters', async () => {
    const pageRes = await fetch(`${baseUrl}/notes/explore?limit=1&page=1`);
    assert.strictEqual(pageRes.status, 200);
    const body = await pageRes.json();

    assert.strictEqual(body.data.notes.length, 1);
    assert.strictEqual(body.data.pagination.page, 1);
    assert.strictEqual(body.data.pagination.limit, 1);
    assert.ok(body.data.pagination.total >= 2);
    assert.ok(body.data.pagination.totalPages >= 2);
  });

  await t.test('8. Filters endpoint returns complete academic taxonomies', async () => {
    const res = await fetch(`${baseUrl}/notes/explore/filters`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    assert.strictEqual(body.success, true);
    assert.ok(Array.isArray(body.data.courses));
    assert.ok(Array.isArray(body.data.categories));
    assert.ok(Array.isArray(body.data.subjects));
    assert.ok(Array.isArray(body.data.semesters));
    assert.ok(typeof body.data.totalApprovedNotes === 'number');

    const courseIds = body.data.courses.map((c) => c.id);
    assert.ok(courseIds.includes(testCourse1.id));

    const categoryIds = body.data.categories.map((c) => c.id);
    assert.ok(categoryIds.includes(testCategory1.id));
  });

  await t.test('9. Single note details endpoint increments view count', async () => {
    const beforeViews = approvedNote1.viewCount;
    const res = await fetch(`${baseUrl}/notes/${approvedNote1.id}`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();

    assert.strictEqual(body.data.id, approvedNote1.id);
    assert.strictEqual(body.data.title, approvedNote1.title);
    assert.strictEqual(body.data.course.name, testCourse1.name);
    assert.strictEqual(body.data.subject.name, testSubject1.name);
  });

  await t.test('10. Private/draft notes are blocked from unauthorized single fetch', async () => {
    const res = await fetch(`${baseUrl}/notes/${draftNote.id}`);
    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'NOTE_ACCESS_FORBIDDEN');
  });

  await t.test('11. Secure file download delivers file and headers', async () => {
    const res = await fetch(`${baseUrl}/notes/${approvedNote1.id}/download`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('content-type'), 'application/pdf');
    assert.ok(res.headers.get('content-disposition').includes('attachment;'));

    const buffer = await res.arrayBuffer();
    assert.ok(buffer.byteLength > 0);
  });

  await t.test('12. Secure file preview supports inline disposition', async () => {
    const res = await fetch(`${baseUrl}/notes/${approvedNote1.id}/file?inline=true`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('content-type'), 'application/pdf');
    assert.ok(res.headers.get('content-disposition').includes('inline;'));
  });

  await t.test('13. Unauthorized download of draft/pending note is blocked', async () => {
    const res = await fetch(`${baseUrl}/notes/${draftNote.id}/download`);
    assert.strictEqual(res.status, 404); // draft note has no storageKey or access forbidden
  });
});
