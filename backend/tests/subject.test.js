import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'http';
import app from '../src/app.js';
import prisma from '../src/config/database.js';
import { generateAccessToken } from '../src/services/tokens/token.service.js';

test('Curriculum Taxonomy & Subject Routes Suite', async (t) => {
  let server;
  let baseUrl;

  let testCourse;
  let testSubject1;
  let testSubject2;
  let testAdmin;
  let testStudent;

  let tokenAdmin;
  let tokenStudent;

  async function api(path, options = {}) {
    const { method = 'GET', token, body } = options;
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });

    let resBody = null;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      resBody = await res.json();
    } else {
      resBody = await res.text();
    }

    return {
      status: res.status,
      body: resBody
    };
  }

  t.before(async () => {
    server = createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api/v1`;

    // Create course
    testCourse = await prisma.course.upsert({
      where: { slug: 'test-tax-course' },
      update: {},
      create: {
        name: 'Test Taxonomy Course',
        slug: 'test-tax-course',
        description: 'Course for taxonomy testing'
      }
    });

    // Create subjects
    testSubject1 = await prisma.subject.upsert({
      where: {
        course_subject_slug_unique: {
          courseId: testCourse.id,
          slug: 'test-subj-algorithms'
        }
      },
      update: {},
      create: {
        courseId: testCourse.id,
        name: 'Test Algorithms',
        slug: 'test-subj-algorithms',
        semester: 3,
        description: 'Advanced Algorithmic Design'
      }
    });

    testSubject2 = await prisma.subject.upsert({
      where: {
        course_subject_slug_unique: {
          courseId: testCourse.id,
          slug: 'test-subj-databases'
        }
      },
      update: {},
      create: {
        courseId: testCourse.id,
        name: 'Test Databases',
        slug: 'test-subj-databases',
        semester: 4,
        description: 'Relational Database Principles'
      }
    });

    // Create admin & student users
    testAdmin = await prisma.user.upsert({
      where: { email: 'tax_admin@pjstudy.com' },
      update: {},
      create: {
        name: 'Taxonomy Admin',
        email: 'tax_admin@pjstudy.com',
        passwordHash: '$2a$12$sampleHashForTax',
        role: 'ADMIN',
        isEmailVerified: true,
        isActive: true
      }
    });

    testStudent = await prisma.user.upsert({
      where: { email: 'tax_student@pjstudy.com' },
      update: {},
      create: {
        name: 'Taxonomy Student',
        email: 'tax_student@pjstudy.com',
        passwordHash: '$2a$12$sampleHashForTax',
        role: 'STUDENT',
        isEmailVerified: true,
        isActive: true
      }
    });

    tokenAdmin = generateAccessToken(testAdmin);
    tokenStudent = generateAccessToken(testStudent);
  });

  t.after(async () => {
    // Teardown
    await prisma.subject.deleteMany({
      where: {
        slug: { in: ['test-subj-algorithms', 'test-subj-databases', 'created-tax-subject'] }
      }
    });
    await prisma.course.deleteMany({
      where: { slug: 'test-tax-course' }
    });
    await prisma.user.deleteMany({
      where: { id: { in: [testAdmin.id, testStudent.id] } }
    });

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // 1. List Subjects
  await t.test('1. GET /api/v1/subjects returns active subjects array', async () => {
    const res = await api('/subjects');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 2);

    const found = res.body.data.find((s) => s.id === testSubject1.id);
    assert.ok(found);
    assert.equal(found.name, 'Test Algorithms');
    assert.equal(found.semester, 3);
    assert.ok(found.course);
  });

  // 2. Filter Subjects by courseId and semester
  await t.test('2. GET /api/v1/subjects?courseId=...&semester=... filters correctly', async () => {
    const res = await api(`/subjects?courseId=${testCourse.id}&semester=4`);
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.equal(res.body.data.length, 1);
    assert.equal(res.body.data[0].id, testSubject2.id);
  });

  // 3. Get Subject by ID
  await t.test(
    '3. GET /api/v1/subjects/:id returns single subject with course relation',
    async () => {
      const res = await api(`/subjects/${testSubject1.id}`);
      assert.equal(res.status, 200);
      assert.equal(res.body.success, true);
      assert.equal(res.body.data.id, testSubject1.id);
      assert.equal(res.body.data.course.id, testCourse.id);
    }
  );

  // 4. Invalid Subject ID returns 404
  await t.test('4. GET /api/v1/subjects/:invalidId returns 404', async () => {
    const res = await api('/subjects/non-existent-subject-uuid');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });

  // 5. List Courses
  await t.test('5. GET /api/v1/courses returns courses catalog', async () => {
    const res = await api('/courses');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));

    const found = res.body.data.find((c) => c.id === testCourse.id);
    assert.ok(found);
    assert.equal(found.slug, 'test-tax-course');
  });

  // 6. Get Course by Slug
  await t.test('6. GET /api/v1/courses/slug/:slug returns course details', async () => {
    const res = await api('/courses/slug/test-tax-course');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.id, testCourse.id);
  });

  // 7. Role-Based Access Control on Subject Creation
  await t.test(
    '7. POST /api/v1/subjects enforces RBAC (401 unauth, 403 student, 201 admin)',
    async () => {
      // Unauthenticated
      const unauth = await api('/subjects', {
        method: 'POST',
        body: { name: 'New Subject', semester: 1, courseId: testCourse.id }
      });
      assert.equal(unauth.status, 401);

      // Student forbidden
      const forbidden = await api('/subjects', {
        method: 'POST',
        token: tokenStudent,
        body: { name: 'New Subject', semester: 1, courseId: testCourse.id }
      });
      assert.equal(forbidden.status, 403);

      // Admin allowed
      const success = await api('/subjects', {
        method: 'POST',
        token: tokenAdmin,
        body: {
          name: 'Created Tax Subject',
          slug: 'created-tax-subject',
          semester: 1,
          courseId: testCourse.id,
          description: 'New syllabus unit'
        }
      });
      assert.equal(success.status, 201);
      assert.equal(success.body.success, true);
      assert.equal(success.body.data.name, 'Created Tax Subject');
    }
  );
});
