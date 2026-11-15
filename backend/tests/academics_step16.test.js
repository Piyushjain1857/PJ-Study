import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import prisma from '../src/config/database.js';
import { generateAccessToken } from '../src/services/tokens/token.service.js';
import { ROLES } from '../src/auth/rolePermissions.js';

test('Academic Hierarchy & Content Management Suite (Step 16)', async (t) => {
  const app = createApp();
  let server;
  let baseUrl;

  let superAdminUser;
  let moderatorUser;
  let studentUser;
  let superAdminToken;
  let moderatorToken;
  let studentToken;

  let createdUniversity;
  let createdSchool;
  let createdCourse;
  let createdSubject;
  let createdCategory;

  t.before(async () => {
    server = app.listen(0);
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}/api/v1`;

    superAdminUser = await prisma.user.findFirst({
      where: { role: ROLES.SUPER_ADMIN, isActive: true }
    });
    if (!superAdminUser) {
      superAdminUser = await prisma.user.create({
        data: {
          name: 'Super Admin Test',
          email: `superadmin-step16-${Date.now()}@pjstudy.com`,
          passwordHash: 'dummy-hash',
          role: ROLES.SUPER_ADMIN,
          isActive: true
        }
      });
    }

    moderatorUser = await prisma.user.findFirst({
      where: { role: ROLES.MODERATOR, isActive: true }
    });
    if (!moderatorUser) {
      moderatorUser = await prisma.user.create({
        data: {
          name: 'Moderator Test',
          email: `mod-step16-${Date.now()}@pjstudy.com`,
          passwordHash: 'dummy-hash',
          role: ROLES.MODERATOR,
          isActive: true
        }
      });
    }

    studentUser = await prisma.user.findFirst({
      where: { role: ROLES.STUDENT, isActive: true }
    });
    if (!studentUser) {
      studentUser = await prisma.user.create({
        data: {
          name: 'Scholar Test',
          email: `student-step16-${Date.now()}@pjstudy.com`,
          passwordHash: 'dummy-hash',
          role: ROLES.STUDENT,
          isActive: true
        }
      });
    }

    superAdminToken = generateAccessToken({
      id: superAdminUser.id,
      email: superAdminUser.email,
      role: superAdminUser.role
    });
    moderatorToken = generateAccessToken({
      id: moderatorUser.id,
      email: moderatorUser.email,
      role: moderatorUser.role
    });
    studentToken = generateAccessToken({
      id: studentUser.id,
      email: studentUser.email,
      role: studentUser.role
    });
  });

  t.after(async () => {
    // Cleanup created test records
    if (createdSubject) {
      await prisma.subject.deleteMany({ where: { id: createdSubject.id } });
    }
    if (createdCourse) {
      await prisma.course.deleteMany({ where: { id: createdCourse.id } });
    }
    if (createdSchool) {
      await prisma.school.deleteMany({ where: { id: createdSchool.id } });
    }
    if (createdUniversity) {
      await prisma.university.deleteMany({ where: { id: createdUniversity.id } });
    }
    if (createdCategory) {
      await prisma.category.deleteMany({ where: { id: createdCategory.id } });
    }
    await new Promise((resolve) => server.close(resolve));
  });

  // 1. RBAC Guard: Scholar cannot mutate taxonomy
  await t.test('1. RBAC Guard: Scholar forbidden from academic mutations (HTTP 403)', async () => {
    const res = await fetch(`${baseUrl}/academics/universities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ name: 'Unauthorized University' })
    });
    assert.equal(res.status, 403);
  });

  // 2. RBAC Guard: Moderator cannot create university or course
  await t.test('2. RBAC Guard: Moderator forbidden from university/course management (HTTP 403)', async () => {
    const res = await fetch(`${baseUrl}/academics/universities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${moderatorToken}`
      },
      body: JSON.stringify({ name: 'Moderator University' })
    });
    assert.equal(res.status, 403);
  });

  // 3. Super Admin creates University
  await t.test('3. University Management: Create University by Super Admin (201)', async () => {
    const uniqueSuffix = Date.now();
    const res = await fetch(`${baseUrl}/academics/universities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        name: `National University of Technology ${uniqueSuffix}`,
        shortName: 'NUT',
        code: `NUT-${uniqueSuffix.toString().slice(-4)}`,
        description: 'Premier national technical university',
        website: 'https://nut.edu'
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.data.id);
    assert.equal(body.data.shortName, 'NUT');
    createdUniversity = body.data;
  });

  // 4. Duplicate University Prevention
  await t.test('4. University Management: Prevent duplicate university name (HTTP 409)', async () => {
    const res = await fetch(`${baseUrl}/academics/universities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        name: createdUniversity.name,
        shortName: 'DUPE'
      })
    });
    assert.equal(res.status, 409);
  });

  // 5. School / Faculty Management
  await t.test('5. School Management: Create School within University (201)', async () => {
    const res = await fetch(`${baseUrl}/academics/schools`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        universityId: createdUniversity.id,
        name: 'School of Computer Science & Engineering',
        code: 'SCSE',
        description: 'Department of computational systems and software engineering'
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.data.id);
    assert.equal(body.data.universityId, createdUniversity.id);
    createdSchool = body.data;
  });

  // 6. Course with Dynamic Semester Structure
  await t.test('6. Dynamic Course Management: Create Course with 6 semesters duration', async () => {
    const uniqueSuffix = Date.now();
    const res = await fetch(`${baseUrl}/academics/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        universityId: createdUniversity.id,
        schoolId: createdSchool.id,
        name: `Bachelor of AI & Data Science ${uniqueSuffix}`,
        code: `BAIDS-${uniqueSuffix.toString().slice(-4)}`,
        degreeLevel: 'Undergraduate',
        semestersCount: 6,
        description: '3-year undergraduate artificial intelligence and data science degree'
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.data.id);
    assert.equal(body.data.semestersCount, 6);
    createdCourse = body.data;
  });

  // 7. Dynamic Semester API: verify valid semesters
  await t.test('7. Dynamic Semester Architecture: GET /courses/:id/semesters returns valid 1..6 array', async () => {
    const res = await fetch(`${baseUrl}/academics/courses/${createdCourse.id}/semesters`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.semestersCount, 6);
    assert.deepEqual(body.data.semesters, [1, 2, 3, 4, 5, 6]);
    assert.ok(body.data.subjectCounts);
  });

  // 8. Subject Management: Create Subject in valid semester
  await t.test('8. Subject Management: Create Subject in Semester 4', async () => {
    const res = await fetch(`${baseUrl}/academics/subjects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        courseId: createdCourse.id,
        name: 'Machine Learning & Neural Networks',
        code: 'AI401',
        semester: 4,
        credits: 4,
        description: 'Deep learning foundations and neural architecture'
      })
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.ok(body.data.id);
    assert.equal(body.data.semester, 4);
    assert.equal(body.data.courseId, createdCourse.id);
    createdSubject = body.data;
  });

  // 9. Dynamic Semester Hierarchy Invariant: Reject Subject with semester > course.semestersCount
  await t.test('9. Dynamic Semester Invariant: Reject Subject in Semester 8 for a 6-semester course', async () => {
    const res = await fetch(`${baseUrl}/academics/subjects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        courseId: createdCourse.id,
        name: 'Invalid Semester Subject',
        semester: 8 // Course only has 6 semesters!
      })
    });
    assert.equal(res.status, 422);
  });

  // 10. Note Category Management: Create and update category
  await t.test('10. Note Category Management: Create and update note category', async () => {
    const uniqueSuffix = Date.now();
    const createRes = await fetch(`${baseUrl}/academics/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        name: `Lab Code Manuals ${uniqueSuffix}`,
        description: 'Source code and execution outputs for laboratory sessions'
      })
    });
    assert.equal(createRes.status, 201);
    const created = (await createRes.json()).data;
    assert.ok(created.id);
    createdCategory = created;

    // Update
    const updateRes = await fetch(`${baseUrl}/academics/categories/${created.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        description: 'Updated lab manual descriptions'
      })
    });
    assert.equal(updateRes.status, 200);
    const updated = (await updateRes.json()).data;
    assert.equal(updated.description, 'Updated lab manual descriptions');
  });

  // 11. Referential Integrity: Prevent deleting course with associated subject
  await t.test('11. Referential Integrity: Cannot delete course with active subjects', async () => {
    const deleteRes = await fetch(`${baseUrl}/academics/courses/${createdCourse.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${superAdminToken}`
      }
    });
    assert.equal(deleteRes.status, 400);
  });

  // 12. Unified Academic Hierarchy Overview: GET /api/v1/academics/overview
  await t.test('12. Academic Overview: Returns complete taxonomy with associated counts', async () => {
    const res = await fetch(`${baseUrl}/academics/overview`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.data.universities));
    assert.ok(Array.isArray(body.data.schools));
    assert.ok(Array.isArray(body.data.courses));
    assert.ok(Array.isArray(body.data.subjects));
    assert.ok(Array.isArray(body.data.categories));

    const foundUni = body.data.universities.find((u) => u.id === createdUniversity.id);
    assert.ok(foundUni);
    assert.equal(foundUni.schoolsCount, 1);
    assert.equal(foundUni.coursesCount, 1);
  });

  // 13. Audit Log Trail Verification
  await t.test('13. Audit Logging: Academic operations generate compliance trail', async () => {
    const logs = await prisma.auditLog.findMany({
      where: {
        entityType: { in: ['UNIVERSITY', 'SCHOOL', 'COURSE', 'SUBJECT', 'CATEGORY'] },
        actorId: superAdminUser.id
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    assert.ok(logs.length >= 4);
    const actions = logs.map((l) => l.action);
    assert.ok(actions.includes('UNIVERSITY_CREATED'));
    assert.ok(actions.includes('SCHOOL_CREATED'));
    assert.ok(actions.includes('COURSE_CREATED'));
    assert.ok(actions.includes('SUBJECT_CREATED'));
  });
});
