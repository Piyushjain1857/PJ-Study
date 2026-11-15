import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import prisma from '../src/config/database.js';
import { generateAccessToken } from '../src/services/tokens/token.service.js';
import { ROLES } from '../src/auth/rolePermissions.js';

test('Step 17 Enterprise Security Hardening & RBAC Verification Suite', async (t) => {
  let server;
  let baseUrl;

  // Spin up ephemeral test HTTP server
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  t.after(() => {
    server.close();
  });

  // Ensure baseline test users exist in MySQL
  const scholarUser = await prisma.user.upsert({
    where: { email: 'sec_step17_scholar@test.com' },
    update: { role: 'STUDENT', isActive: true },
    create: {
      email: 'sec_step17_scholar@test.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLM',
      name: 'Step17 Scholar',
      role: 'STUDENT',
      isActive: true,
      isEmailVerified: true
    }
  });

  const otherScholarUser = await prisma.user.upsert({
    where: { email: 'sec_step17_other_scholar@test.com' },
    update: { role: 'STUDENT', isActive: true },
    create: {
      email: 'sec_step17_other_scholar@test.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLM',
      name: 'Step17 Other Scholar',
      role: 'STUDENT',
      isActive: true,
      isEmailVerified: true
    }
  });

  const moderatorUser = await prisma.user.upsert({
    where: { email: 'sec_step17_moderator@test.com' },
    update: { role: 'MODERATOR', isActive: true },
    create: {
      email: 'sec_step17_moderator@test.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLM',
      name: 'Step17 Moderator',
      role: 'MODERATOR',
      isActive: true,
      isEmailVerified: true
    }
  });

  const superAdminUser = await prisma.user.upsert({
    where: { email: 'sec_step17_admin@test.com' },
    update: { role: 'SUPER_ADMIN', isActive: true },
    create: {
      email: 'sec_step17_admin@test.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLM',
      name: 'Step17 SuperAdmin',
      role: 'SUPER_ADMIN',
      isActive: true,
      isEmailVerified: true
    }
  });

  const suspendedUser = await prisma.user.upsert({
    where: { email: 'sec_step17_suspended@test.com' },
    update: { role: 'STUDENT', isActive: false },
    create: {
      email: 'sec_step17_suspended@test.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLM',
      name: 'Step17 Suspended',
      role: 'STUDENT',
      isActive: false,
      isEmailVerified: true
    }
  });

  // Get active subject and category
  const testSubject = await prisma.subject.findFirst({
    where: { isActive: true, slug: { notIn: ['rec-algo', 'rec-os', 'rec-circuits'] } }
  });
  const testCategory = await prisma.category.findFirst({ where: { isActive: true } });
  const testCourseId = testSubject.courseId;

  // Create an approved note and a draft note
  const approvedNote = await prisma.note.create({
    data: {
      title: 'Approved Security Architecture Note',
      slug: `approved-sec-arch-${Date.now()}`,
      content: 'Comprehensive study note for secure architecture.',
      storageKey: 'sec17-sample.pdf',
      fileName: 'sec17-sample.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      status: 'APPROVED',
      semester: 1,
      subjectId: testSubject.id,
      courseId: testCourseId,
      categoryId: testCategory.id,
      uploadedById: moderatorUser.id,
      publishedAt: new Date()
    }
  });

  const draftNote = await prisma.note.create({
    data: {
      title: 'Draft In-Progress Note',
      slug: `draft-sec-note-${Date.now()}`,
      content: 'Private draft note that should not be publicly accessible.',
      storageKey: 'sec17-draft.pdf',
      fileName: 'sec17-draft.pdf',
      fileSize: 2048,
      mimeType: 'application/pdf',
      status: 'DRAFT',
      semester: 1,
      subjectId: testSubject.id,
      courseId: testCourseId,
      categoryId: testCategory.id,
      uploadedById: moderatorUser.id
    }
  });

  const scholarToken = generateAccessToken(scholarUser);
  const otherScholarToken = generateAccessToken(otherScholarUser);
  const moderatorToken = generateAccessToken(moderatorUser);
  const superAdminToken = generateAccessToken(superAdminUser);
  const suspendedToken = generateAccessToken(suspendedUser);

  // 1. Unauthorized Scholar upload returns 403
  await t.test('1. Unauthorized Scholar upload returns HTTP 403', async () => {
    const res = await fetch(`${baseUrl}/api/v1/notes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${scholarToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Unauthorized Scholar Note',
        courseId: testCourseId,
        subjectId: testSubject.id,
        semester: 1
      })
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(
      ['FORBIDDEN', 'DOWNLOAD_FORBIDDEN'].includes(body.error?.code),
      `Expected FORBIDDEN or DOWNLOAD_FORBIDDEN, got ${body.error?.code}`
    );
  });

  // 2. Authorized Scholar download succeeds
  await t.test('2. Authorized Scholar download succeeds for approved notes', async () => {
    const res = await fetch(`${baseUrl}/api/v1/notes/${approvedNote.id}/download`, {
      headers: { Authorization: `Bearer ${scholarToken}` }
    });

    // In unit/integration environment, either 200 (if file on disk) or 404 (file missing on disk)
    // but crucially NOT 401 or 403
    assert.ok(
      [200, 404].includes(res.status),
      `Expected 200 or 404 NO_FILE, got ${res.status}`
    );
    assert.notEqual(res.status, 403);
    assert.notEqual(res.status, 401);
  });

  // 3. Unauthorized private/draft note download fails
  await t.test('3. Unauthorized private/draft note download returns HTTP 403', async () => {
    const res = await fetch(`${baseUrl}/api/v1/notes/${draftNote.id}/download`, {
      headers: { Authorization: `Bearer ${scholarToken}` }
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(
      ['FORBIDDEN', 'DOWNLOAD_FORBIDDEN'].includes(body.error?.code),
      `Expected FORBIDDEN or DOWNLOAD_FORBIDDEN, got ${body.error?.code}`
    );
  });

  // 4. Moderator privilege escalation fails
  await t.test('4. Moderator privilege escalation fails (cannot modify user roles or promote to Super Admin)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/admin/users/${scholarUser.id}/role`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${moderatorToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: 'SUPER_ADMIN' })
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  // 5. Scholar admin access fails
  await t.test('5. Scholar access to admin endpoints strictly returns HTTP 403', async () => {
    const endpoints = [
      '/api/v1/admin/overview',
      '/api/v1/admin/analytics',
      '/api/v1/admin/users',
      '/api/v1/admin/moderators',
      '/api/v1/admin/settings'
    ];

    for (const ep of endpoints) {
      const res = await fetch(`${baseUrl}${ep}`, {
        headers: { Authorization: `Bearer ${scholarToken}` }
      });
      assert.equal(res.status, 403, `Expected 403 on ${ep}, got ${res.status}`);
    }
  });

  // 6. Cross-user resource access fails (IDOR protection on reviews)
  await t.test('6. Cross-user resource modification blocked (IDOR Protection)', async () => {
    // Create review by Scholar A
    const review = await prisma.review.create({
      data: {
        noteId: approvedNote.id,
        userId: scholarUser.id,
        rating: 5,
        comment: 'Original excellent review by Scholar A.'
      }
    });

    // Scholar B attempts to edit Scholar A's review
    const editRes = await fetch(`${baseUrl}/api/v1/notes/${approvedNote.id}/reviews/${review.id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${otherScholarToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ rating: 1, comment: 'Malicious modification by Scholar B' })
    });

    assert.equal(editRes.status, 403);
    const editBody = await editRes.json();
    assert.equal(editBody.success, false);
    assert.equal(editBody.error?.code, 'FORBIDDEN');

    // Clean up review
    await prisma.review.delete({ where: { id: review.id } });
  });

  // 7. Invalid uploads are rejected
  await t.test('7. Invalid file uploads rejected (unsupported file types / malicious formats)', async () => {
    // Attempt uploading note with forbidden executable mime or invalid extension
    const res = await fetch(`${baseUrl}/api/v1/notes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${moderatorToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Exploit Test',
        fileName: 'malware.exe',
        fileUrl: 'local://notes/malware.exe',
        fileType: 'application/x-msdownload',
        courseId: testCourseId,
        subjectId: testSubject.id,
        semester: 1
      })
    });

    // Must be rejected by validation or file type checking (400 or 422)
    assert.ok(
      [400, 422].includes(res.status),
      `Expected 400 or 422 for forbidden file type, got ${res.status}`
    );
  });

  // 8. Unsafe paths are rejected (Path Traversal Protection)
  await t.test('8. Path traversal in storage paths is rejected', async () => {
    const res = await fetch(`${baseUrl}/api/v1/notes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${moderatorToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Path Traversal Note',
        fileName: '../../../etc/passwd',
        fileUrl: 'local://notes/../../../etc/passwd',
        fileType: 'application/pdf',
        courseId: testCourseId,
        subjectId: testSubject.id,
        semester: 1
      })
    });

    assert.ok(
      [400, 403, 422].includes(res.status),
      `Expected 400/403/422 on path traversal, got ${res.status}`
    );
  });

  // 9. Invalid input is rejected (Mass Assignment / Role manipulation in profile)
  await t.test('9. Mass assignment on user profile is rejected or ignored', async () => {
    const res = await fetch(`${baseUrl}/api/v1/profile/me`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${scholarToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Legit Name Change',
        role: 'SUPER_ADMIN', // Mass assignment exploit attempt
        isAdmin: true
      })
    });

    assert.ok(
      [400, 403, 422].includes(res.status),
      `Expected 400, 403, or 422 for mass assignment attempt, got ${res.status}`
    );
    // Verify user role in database did NOT change to SUPER_ADMIN
    const userInDb = await prisma.user.findUnique({ where: { id: scholarUser.id } });
    assert.equal(userInDb.role, 'STUDENT', 'User role must not be modifiable via profile endpoint');
  });

  // 10. Sensitive data is not leaked
  await t.test('10. Sensitive credentials (passwordHash, refreshToken) never exposed in API responses', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${scholarToken}` }
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    const userObj = body.data?.user || body.data;
    assert.ok(userObj);
    assert.equal(userObj.passwordHash, undefined);
    assert.equal(userObj.password, undefined);
    assert.equal(userObj.refreshToken, undefined);
    assert.equal(userObj.verificationToken, undefined);
  });

  // 11. Suspended account access is enforced
  await t.test('11. Suspended account access is blocked with HTTP 403 ACCOUNT_SUSPENDED', async () => {
    const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
      headers: { Authorization: `Bearer ${suspendedToken}` }
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error?.code, 'ACCOUNT_SUSPENDED');
  });

  // 12. Privileged role changes are audited with sanitized metadata
  await t.test('12. Privileged actions written to AuditLog with sensitive fields sanitized', async () => {
    const res = await fetch(`${baseUrl}/api/v1/admin/users/${otherScholarUser.id}/role`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'MODERATOR',
        reason: 'Promoted for Step 17 audit verification'
      })
    });

    assert.equal(res.status, 200);

    // Verify AuditLog record exists
    const auditRecord = await prisma.auditLog.findFirst({
      where: {
        action: 'USER_ROLE_CHANGED',
        entityId: otherScholarUser.id
      },
      orderBy: { createdAt: 'desc' }
    });

    assert.ok(auditRecord, 'AuditLog entry must be recorded for role change');
    assert.equal(auditRecord.actorId, superAdminUser.id);
    
    // Check that metadata exists and contains no leaked hashes
    const metaStr = JSON.stringify(auditRecord.metadata || {});
    assert.ok(!metaStr.includes('passwordHash'), 'Audit metadata must not contain passwordHash');
    assert.ok(!metaStr.includes('$2b$10$'), 'Audit metadata must not contain bcrypt hashes');
  });

  // Clean up test records
  t.after(async () => {
    try {
      await prisma.note.deleteMany({
        where: { id: { in: [approvedNote.id, draftNote.id] } }
      });
      await prisma.user.deleteMany({
        where: {
          id: { in: [scholarUser.id, otherScholarUser.id, moderatorUser.id, suspendedUser.id] }
        }
      });
    } catch (_) {}
  });
});
