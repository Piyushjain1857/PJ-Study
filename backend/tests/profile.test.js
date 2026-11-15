import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'http';
import app from '../src/app.js';
import prisma from '../src/config/database.js';
import { generateAccessToken } from '../src/services/tokens/token.service.js';

test('Student Profiles, Academic Identity & Public Contributor Profiles Suite', async (t) => {
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
  let pendingNote;
  let rejectedNote;

  t.before(async () => {
    server = createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api/v1`;

    // 1. Create or fetch test course, subject, category
    testCourse = await prisma.course.upsert({
      where: { slug: 'profile-test-course' },
      update: {},
      create: {
        name: 'Computer Science & Engineering',
        slug: 'profile-test-course',
        description: 'Profile testing degree'
      }
    });

    testSubject = await prisma.subject.upsert({
      where: {
        course_subject_slug_unique: {
          courseId: testCourse.id,
          slug: 'profile-algo'
        }
      },
      update: {},
      create: {
        name: 'Algorithms & Complexity',
        slug: 'profile-algo',
        courseId: testCourse.id,
        semester: 4
      }
    });

    testCategory = await prisma.category.findFirst({ where: { isActive: true } });
    if (!testCategory) {
      testCategory = await prisma.category.create({
        data: {
          name: 'Profile Lecture Notes',
          slug: 'profile-lecture-notes'
        }
      });
    }

    // 2. Create test students A and B
    studentA = await prisma.user.upsert({
      where: { email: 'profile_student_a@pjstudy.com' },
      update: {
        name: 'Alice Scholar',
        role: 'STUDENT',
        isActive: true,
        publicProfileEnabled: true,
        showAcademicInfo: true,
        showBio: true,
        showContributionStats: true,
        university: 'Stanford University',
        courseId: testCourse.id,
        semester: 4,
        bio: 'Passionate about algorithms and distributed systems.'
      },
      create: {
        name: 'Alice Scholar',
        email: 'profile_student_a@pjstudy.com',
        passwordHash: 'dummy-hash-a',
        role: 'STUDENT',
        isActive: true,
        isEmailVerified: true,
        publicProfileEnabled: true,
        showAcademicInfo: true,
        showBio: true,
        showContributionStats: true,
        university: 'Stanford University',
        courseId: testCourse.id,
        semester: 4,
        bio: 'Passionate about algorithms and distributed systems.'
      }
    });

    studentB = await prisma.user.upsert({
      where: { email: 'profile_student_b@pjstudy.com' },
      update: {
        name: 'Bob Private',
        role: 'STUDENT',
        isActive: true,
        publicProfileEnabled: false,
        showAcademicInfo: false,
        showBio: false,
        showContributionStats: false
      },
      create: {
        name: 'Bob Private',
        email: 'profile_student_b@pjstudy.com',
        passwordHash: 'dummy-hash-b',
        role: 'STUDENT',
        isActive: true,
        isEmailVerified: true,
        publicProfileEnabled: false,
        showAcademicInfo: false,
        showBio: false,
        showContributionStats: false
      }
    });

    tokenA = generateAccessToken({ id: studentA.id, role: studentA.role });
    tokenB = generateAccessToken({ id: studentB.id, role: studentB.role });

    // 3. Create sample notes for student A: 1 approved, 1 pending, 1 rejected
    approvedNote = await prisma.note.upsert({
      where: { storageKey: 'profile-test-dp.pdf' },
      update: {
        status: 'APPROVED',
        uploadedById: studentA.id,
        downloadCount: 42,
        viewCount: 150
      },
      create: {
        title: 'Mastering Dynamic Programming',
        slug: 'profile-approved-note',
        description: 'Comprehensive DP guide',
        fileName: 'dp-notes.pdf',
        storageKey: 'profile-test-dp.pdf',
        fileSize: 1024,
        mimeType: 'application/pdf',
        courseId: testCourse.id,
        subjectId: testSubject.id,
        categoryId: testCategory.id,
        semester: 4,
        status: 'APPROVED',
        uploadedById: studentA.id,
        downloadCount: 42,
        viewCount: 150
      }
    });

    pendingNote = await prisma.note.upsert({
      where: { storageKey: 'profile-test-graphs.pdf' },
      update: {
        status: 'PENDING_REVIEW',
        uploadedById: studentA.id
      },
      create: {
        title: 'Graph Theory Draft',
        slug: 'profile-pending-note',
        description: 'Graph theory summary in review',
        fileName: 'graphs.pdf',
        storageKey: 'profile-test-graphs.pdf',
        fileSize: 2048,
        mimeType: 'application/pdf',
        courseId: testCourse.id,
        subjectId: testSubject.id,
        categoryId: testCategory.id,
        semester: 4,
        status: 'PENDING_REVIEW',
        uploadedById: studentA.id
      }
    });

    rejectedNote = await prisma.note.upsert({
      where: { storageKey: 'profile-test-flows.pdf' },
      update: {
        status: 'REJECTED',
        uploadedById: studentA.id,
        rejectionReason: 'Illegible scans'
      },
      create: {
        title: 'Network Flows Notes',
        slug: 'profile-rejected-note',
        description: 'Network flows rough notes',
        fileName: 'flows.pdf',
        storageKey: 'profile-test-flows.pdf',
        fileSize: 512,
        mimeType: 'application/pdf',
        courseId: testCourse.id,
        subjectId: testSubject.id,
        categoryId: testCategory.id,
        semester: 4,
        status: 'REJECTED',
        rejectionReason: 'Illegible scans',
        uploadedById: studentA.id
      }
    });
  });

  t.after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    // Cleanup created test notes and users
    await prisma.review.deleteMany({
      where: { noteId: { in: [approvedNote.id, pendingNote.id, rejectedNote.id] } }
    });
    await prisma.note.deleteMany({
      where: { id: { in: [approvedNote.id, pendingNote.id, rejectedNote.id] } }
    });
    await prisma.user.deleteMany({
      where: { id: { in: [studentA.id, studentB.id] } }
    });
  });

  // 1. Retrieve own profile
  await t.test('1. Retrieve own profile with complete academic identity & stats', async () => {
    const res = await fetch(`${baseUrl}/profile/me`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.id, studentA.id);
    assert.equal(body.data.email, studentA.email);
    assert.equal(body.data.name, 'Alice Scholar');
    assert.equal(body.data.university, 'Stanford University');
    assert.equal(body.data.semester, 4);
    assert.ok(body.data.stats, 'Profile must include database-calculated stats');
    assert.equal(body.data.stats.totalUploads, 3);
    assert.equal(body.data.stats.approvedNotes, 1);
    assert.equal(body.data.stats.pendingNotes, 1);
    assert.equal(body.data.stats.rejectedNotes, 1);
    assert.equal(body.data.stats.totalDownloads, 42);
  });

  // 2. Update permitted fields
  await t.test('2. Update permitted profile fields (name, bio, university, semester)', async () => {
    const res = await fetch(`${baseUrl}/profile/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        name: 'Alice Turing',
        bio: 'Updated academic bio.',
        university: 'MIT',
        semester: 6
      })
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.name, 'Alice Turing');
    assert.equal(body.data.university, 'MIT');
    assert.equal(body.data.semester, 6);
    assert.equal(body.data.bio, 'Updated academic bio.');
  });

  // 3. Reject role modification
  await t.test('3. Strictly reject role tampering with 403', async () => {
    const res = await fetch(`${baseUrl}/profile/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        role: 'SUPER_ADMIN'
      })
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'FORBIDDEN_FIELD_MODIFICATION');
  });

  // 4. Reject tampering with email, isActive, isEmailVerified
  await t.test('4. Reject tampering with system email or verification status', async () => {
    const res = await fetch(`${baseUrl}/profile/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        email: 'hacked@portal.com',
        isEmailVerified: true
      })
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error.code, 'FORBIDDEN_FIELD_MODIFICATION');
  });

  // 5. Validate bio length
  await t.test('5. Reject biography exceeding 300 characters', async () => {
    const longBio = 'A'.repeat(301);
    const res = await fetch(`${baseUrl}/profile/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({ bio: longBio })
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'BIO_EXCEEDS_MAX_LENGTH');
  });

  // 6. Validate academic metadata
  await t.test('6. Validate semester bounds (1-12) and invalid courseId', async () => {
    // Semester 0
    const resZero = await fetch(`${baseUrl}/profile/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({ semester: 0 })
    });
    assert.equal(resZero.status, 400);

    // Semester 15
    const resHigh = await fetch(`${baseUrl}/profile/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({ semester: 15 })
    });
    assert.equal(resHigh.status, 400);

    // Nonexistent courseId
    const resCourse = await fetch(`${baseUrl}/profile/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({ courseId: 'nonexistent-uuid-12345' })
    });
    assert.equal(resCourse.status, 400);
  });

  // 7. Upload valid avatar
  await t.test('7. Upload valid avatar image with genuine magic bytes', async () => {
    // Valid PNG buffer: \x89PNG\r\n\x1a\n plus 100 bytes
    const pngHeader = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d
    ]);
    const validPngBuffer = Buffer.concat([pngHeader, Buffer.alloc(100)]);

    const formData = new FormData();
    formData.append(
      'avatar',
      new Blob([validPngBuffer], { type: 'image/png' }),
      'scholar-avatar.png'
    );

    const res = await fetch(`${baseUrl}/profile/me/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`
      },
      body: formData
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.avatarUrl.startsWith('/api/v1/profile/avatar/'));

    // Check streaming endpoint
    const streamRes = await fetch(
      `http://localhost:${server.address().port}${body.data.avatarUrl}`
    );
    assert.equal(streamRes.status, 200);
    assert.equal(streamRes.headers.get('content-type'), 'image/png');
  });

  // 8. Reject invalid avatar
  await t.test('8. Reject corrupted/non-image buffer disguised as PNG', async () => {
    const fakeBuffer = Buffer.from('THIS IS NOT A VALID IMAGE BUFFER AT ALL');
    const formData = new FormData();
    formData.append('avatar', new Blob([fakeBuffer], { type: 'image/png' }), 'fake.png');

    const res = await fetch(`${baseUrl}/profile/me/avatar`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`
      },
      body: formData
    });

    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'INVALID_IMAGE_SIGNATURE');
  });

  // 9. Remove avatar
  await t.test('9. Remove avatar reverts avatarUrl to null', async () => {
    const res = await fetch(`${baseUrl}/profile/me/avatar`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${tokenA}`
      }
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.avatarUrl, null);
  });

  // 10. Retrieve own uploads
  await t.test('10. Retrieve own uploads with status filtering and pagination', async () => {
    // All uploads
    const resAll = await fetch(`${baseUrl}/profile/me/uploads?status=ALL`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    assert.equal(resAll.status, 200);
    const bodyAll = await resAll.json();
    assert.equal(bodyAll.data.items.length, 3);
    assert.equal(bodyAll.data.meta.totalItems, 3);

    // Only approved
    const resAppr = await fetch(`${baseUrl}/profile/me/uploads?status=APPROVED`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    assert.equal(resAppr.status, 200);
    const bodyAppr = await resAppr.json();
    assert.equal(bodyAppr.data.items.length, 1);
    assert.equal(bodyAppr.data.items[0].id, approvedNote.id);

    // Only rejected
    const resRej = await fetch(`${baseUrl}/profile/me/uploads?status=REJECTED`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    assert.equal(resRej.status, 200);
    const bodyRej = await resRej.json();
    assert.equal(bodyRej.data.items.length, 1);
    assert.equal(bodyRej.data.items[0].rejectionReason, 'Illegible scans');
  });

  // 11. Verify contribution statistics
  await t.test('11. Retrieve contributor statistics endpoint directly', async () => {
    const res = await fetch(`${baseUrl}/profile/me/stats`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.totalUploads, 3);
    assert.equal(body.data.approvedNotes, 1);
    assert.equal(body.data.pendingNotes, 1);
    assert.equal(body.data.rejectedNotes, 1);
    assert.equal(body.data.totalDownloads, 42);
  });

  // 12. Enforce public profile visibility
  await t.test('12. Enforce private contributor profile for student B', async () => {
    const res = await fetch(`${baseUrl}/contributors/${studentB.id}`);

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.isPrivate, true);
    assert.equal(
      body.data.message,
      'This contributor has configured their academic profile as private.'
    );
    assert.equal(body.data.stats, undefined);
    assert.equal(body.data.academicInfo, undefined);

    // Notes endpoint for private contributor must return 403
    const notesRes = await fetch(`${baseUrl}/contributors/${studentB.id}/notes`);
    assert.equal(notesRes.status, 403);
    const notesBody = await notesRes.json();
    assert.equal(notesBody.error.code, 'PROFILE_IS_PRIVATE');
  });

  // 13. Public contributor profile for student A
  await t.test('13. Retrieve public contributor profile with permitted fields', async () => {
    const res = await fetch(`${baseUrl}/contributors/${studentA.id}`);

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.data.isPrivate, false);
    assert.equal(body.data.name, 'Alice Turing');
    assert.equal(body.data.academicInfo.university, 'MIT');
    assert.ok(body.data.stats, 'Public stats must be included when opted in');
    assert.equal(body.data.stats.totalApprovedNotes, 1);
    assert.equal(body.data.stats.totalDownloads, 42);

    // Security check: email, role, and verification must NEVER be present
    assert.equal(body.data.email, undefined);
    assert.equal(body.data.role, undefined);
    assert.equal(body.data.passwordHash, undefined);
  });

  // 14. Exclude pending and rejected notes from public notes
  await t.test(
    '14. Public contributor notes list MUST exclude pending/rejected notes',
    async () => {
      const res = await fetch(`${baseUrl}/contributors/${studentA.id}/notes`);

      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.data.items.length, 1);
      assert.equal(body.data.items[0].id, approvedNote.id);
      assert.equal(body.data.items[0].status, 'APPROVED');
    }
  );

  // 15. Privacy toggle updates
  await t.test('15. Update privacy settings and verify changes reflect publicly', async () => {
    // Hide academic info and stats
    const toggleRes = await fetch(`${baseUrl}/profile/me/privacy`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({
        showAcademicInfo: false,
        showContributionStats: false
      })
    });

    assert.equal(toggleRes.status, 200);
    const toggleBody = await toggleRes.json();
    assert.equal(toggleBody.data.showAcademicInfo, false);
    assert.equal(toggleBody.data.showContributionStats, false);

    // Now query public contributor profile
    const publicRes = await fetch(`${baseUrl}/contributors/${studentA.id}`);
    assert.equal(publicRes.status, 200);
    const publicBody = await publicRes.json();
    assert.equal(publicBody.data.academicInfo, null);
    assert.equal(publicBody.data.stats, null);
  });

  // 16. Handle nonexistent users
  await t.test('16. Nonexistent contributor ID returns 404', async () => {
    const res = await fetch(`${baseUrl}/contributors/99999999-9999-9999-9999-999999999999`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error.code, 'CONTRIBUTOR_NOT_FOUND');
  });

  // 17. Academic options helper
  await t.test('17. Academic options endpoint returns courses with semesters', async () => {
    const res = await fetch(`${baseUrl}/profile/academic-options`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.ok(Array.isArray(body.data));
    const course = body.data.find((c) => c.id === testCourse.id);
    assert.ok(course, 'Should find profile test course');
    assert.ok(Array.isArray(course.semesters));
  });
});
