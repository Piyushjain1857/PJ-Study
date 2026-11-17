import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'http';
import { execSync } from 'child_process';
import prisma from '../src/config/database.js';
import app from '../src/app.js';
import { generateAccessToken } from '../src/services/tokens/token.service.js';

test('PJ Study — Unauthorized Automatic User & Note Creation Prevention Suite', async (t) => {
  let server;
  let baseUrl;

  let testAdminUser;
  let testScholarUser;
  let testCourse;
  let testSubject;

  let adminToken;
  let scholarToken;

  t.before(async () => {
    server = createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api/v1`;

    // 1. Get or create reference course & subject for tests
    testCourse = await prisma.course.upsert({
      where: { slug: 'sec-guard-course' },
      update: {},
      create: {
        name: 'Security Guard Course',
        slug: 'sec-guard-course',
        description: 'Course for testing upload security safeguards',
        degreeLevel: 'BACHELORS',
        semestersCount: 6,
        isActive: true
      }
    });

    testSubject = await prisma.subject.upsert({
      where: {
        course_subject_slug_unique: {
          courseId: testCourse.id,
          slug: 'sec-guard-subject'
        }
      },
      update: {},
      create: {
        name: 'Security Safeguards 101',
        slug: 'sec-guard-subject',
        courseId: testCourse.id,
        semester: 1,
        isActive: true
      }
    });

    // 2. Setup isolated Admin & Scholar test users
    testAdminUser = await prisma.user.upsert({
      where: { email: 'sec_admin_guard@pjstudy.com' },
      update: {},
      create: {
        name: 'Sec Guard Admin',
        email: 'sec_admin_guard@pjstudy.com',
        passwordHash: '$2a$12$sampleHashForSecurityTests00000000000',
        role: 'ADMIN',
        isEmailVerified: true,
        isActive: true
      }
    });

    testScholarUser = await prisma.user.upsert({
      where: { email: 'sec_scholar_guard@pjstudy.com' },
      update: {},
      create: {
        name: 'Sec Guard Scholar',
        email: 'sec_scholar_guard@pjstudy.com',
        passwordHash: '$2a$12$sampleHashForSecurityTests00000000000',
        role: 'STUDENT',
        isEmailVerified: true,
        isActive: true
      }
    });

    adminToken = generateAccessToken(testAdminUser);
    scholarToken = generateAccessToken(testScholarUser);
  });

  t.after(async () => {
    // Clean up test users and test courses created in this suite
    await prisma.note.deleteMany({ where: { subjectId: testSubject?.id } }).catch(() => {});
    await prisma.subject.deleteMany({ where: { id: testSubject?.id } }).catch(() => {});
    await prisma.course.deleteMany({ where: { id: testCourse?.id } }).catch(() => {});
    await prisma.user.deleteMany({
      where: { email: { in: ['sec_admin_guard@pjstudy.com', 'sec_scholar_guard@pjstudy.com'] } }
    }).catch(() => {});

    server.close();
  });

  // ---------------------------------------------------------------------------
  // 1. Seed Guard Requirement
  // ---------------------------------------------------------------------------
  await t.test('1. Database seeding halts safely when executed without --confirm-seed', () => {
    let output = '';
    try {
      execSync('node backend/prisma/seed.js', { encoding: 'utf-8', stdio: 'pipe' });
    } catch (e) {
      output = `${e.stdout || ''}\n${e.stderr || ''}`;
    }
    if (!output) {
      // If exited 0 cleanly, read from child process with combined stdout/stderr
      output = execSync('node backend/prisma/seed.js 2>&1', { encoding: 'utf-8' });
    }
    assert.ok(output.includes('[SEED GUARD]'), 'Expected SEED GUARD message in output');
    assert.ok(output.includes('strictly opt-in'), 'Expected opt-in explanation in output');
  });

  // ---------------------------------------------------------------------------
  // 2. Scholar Upload Block Requirement
  // ---------------------------------------------------------------------------
  await t.test('2. Unauthenticated upload attempt is blocked with HTTP 401', async () => {
    const res = await fetch(`${baseUrl}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Unauthorized Note',
        content: 'Content that should be blocked',
        subjectId: testSubject.id
      })
    });

    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
  });

  await t.test('3. Scholar user upload attempt is strictly blocked with HTTP 403 UPLOAD_FORBIDDEN', async () => {
    const initialNotesCount = await prisma.note.count({ where: { subjectId: testSubject.id } });

    const res = await fetch(`${baseUrl}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${scholarToken}`
      },
      body: JSON.stringify({
        title: 'Scholar Attempted Note',
        content: 'Scholars must never be able to create notes.',
        subjectId: testSubject.id
      })
    });

    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.ok(
      body.error?.code === 'UPLOAD_FORBIDDEN' || body.error?.code === 'FORBIDDEN',
      `Expected UPLOAD_FORBIDDEN or FORBIDDEN, received: ${body.error?.code}`
    );

    // Verify no note was created in the database
    const postNotesCount = await prisma.note.count({ where: { subjectId: testSubject.id } });
    assert.strictEqual(postNotesCount, initialNotesCount, 'Zero notes should be created by scholars');
  });

  // ---------------------------------------------------------------------------
  // 3. Authorized Admin Upload Requirement
  // ---------------------------------------------------------------------------
  await t.test('4. Authenticated Admin CAN successfully create notes', async () => {
    const res = await fetch(`${baseUrl}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Admin Authorized Study Note',
        content: 'Authorized educational manuscript content.',
        subjectId: testSubject.id,
        courseId: testCourse.id,
        semester: 1
      })
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.title, 'Admin Authorized Study Note');
    assert.strictEqual(body.data.status, 'PUBLISHED');

    // Clean up created test note
    await prisma.note.deleteMany({ where: { id: body.data.id } });
  });

  // ---------------------------------------------------------------------------
  // 4. Legitimate User Registration Still Works
  // ---------------------------------------------------------------------------
  await t.test('5. Public user registration works legitimately and assigns STUDENT role', async () => {
    const testRegEmail = `reg_test_${Date.now()}@pjstudy.com`;

    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Registered Scholar',
        email: testRegEmail,
        password: 'ValidPassword123!'
      })
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.role, 'STUDENT', 'Registered user must always be STUDENT');

    // Clean up registered test user
    await prisma.emailVerificationToken.deleteMany({ where: { user: { email: testRegEmail } } });
    await prisma.user.deleteMany({ where: { email: testRegEmail } });
  });

  // ---------------------------------------------------------------------------
  // 5. Normal Viewing and Navigation does not create users or notes
  // ---------------------------------------------------------------------------
  await t.test('6. GET /notes/explore does not create notes or users', async () => {
    const usersBefore = await prisma.user.count();
    const notesBefore = await prisma.note.count();

    const res = await fetch(`${baseUrl}/notes/explore`);
    assert.strictEqual(res.status, 200);

    const usersAfter = await prisma.user.count();
    const notesAfter = await prisma.note.count();

    assert.strictEqual(usersAfter, usersBefore, 'No users should be created on browse/explore');
    assert.strictEqual(notesAfter, notesBefore, 'No notes should be created on browse/explore');
  });

  await t.test('7. Health endpoint does not mutate database records', async () => {
    const usersBefore = await prisma.user.count();
    const notesBefore = await prisma.note.count();

    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);

    const usersAfter = await prisma.user.count();
    const notesAfter = await prisma.note.count();

    assert.strictEqual(usersAfter, usersBefore);
    assert.strictEqual(notesAfter, notesBefore);
  });
});
