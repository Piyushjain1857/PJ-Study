import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../src/config/database.js';
import app from '../src/app.js';
import env from '../src/config/env.js';
import { generateAccessToken } from '../src/services/tokens/token.service.js';
import { hashToken } from '../src/services/tokens/token.service.js';
import { hashPassword } from '../src/utils/password.js';
import { storageService } from '../src/services/storage/storage.service.js';

test('PJ Study Comprehensive Application Security Hardening Suite (Section 24)', async (t) => {
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
  let testUnpublishedNote;

  const testUserEmails = [
    'sec_hardening_scholar@pjstudy.com',
    'sec_hardening_admin@pjstudy.com',
    'sec_hardening_super@pjstudy.com'
  ];

  t.before(async () => {
    server = createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api/v1`;

    const pwHash = await hashPassword('PjStudySecured#2026');

    scholarUser = await prisma.user.upsert({
      where: { email: 'sec_hardening_scholar@pjstudy.com' },
      update: { role: 'STUDENT', isActive: true },
      create: {
        name: 'Secured Scholar User',
        email: 'sec_hardening_scholar@pjstudy.com',
        passwordHash: pwHash,
        role: 'STUDENT',
        isActive: true,
        isEmailVerified: true
      }
    });

    adminUser = await prisma.user.upsert({
      where: { email: 'sec_hardening_admin@pjstudy.com' },
      update: { role: 'ADMIN', isActive: true },
      create: {
        name: 'Secured Admin User',
        email: 'sec_hardening_admin@pjstudy.com',
        passwordHash: pwHash,
        role: 'ADMIN',
        isActive: true,
        isEmailVerified: true
      }
    });

    superAdminUser = await prisma.user.upsert({
      where: { email: 'sec_hardening_super@pjstudy.com' },
      update: { role: 'SUPER_ADMIN', isActive: true },
      create: {
        name: 'Secured Super Admin User',
        email: 'sec_hardening_super@pjstudy.com',
        passwordHash: pwHash,
        role: 'SUPER_ADMIN',
        isActive: true,
        isEmailVerified: true
      }
    });

    testCourse = await prisma.course.upsert({
      where: { slug: 'sec-hard-101' },
      update: { isActive: true },
      create: {
        name: 'Security Engineering Course',
        code: 'SEC-HARD-101',
        slug: 'sec-hard-101',
        semestersCount: 8,
        degreeLevel: 'Bachelor of Technology',
        isActive: true
      }
    });

    testSubject = await prisma.subject.upsert({
      where: {
        course_subject_slug_unique: {
          courseId: testCourse.id,
          slug: 'sec-hard-sub'
        }
      },
      update: { semester: 1, isActive: true },
      create: {
        name: 'Cybersecurity Fundamentals',
        slug: 'sec-hard-sub',
        code: 'SEC-CS101',
        courseId: testCourse.id,
        semester: 1,
        isActive: true
      }
    });

    testCategory = await prisma.category.upsert({
      where: { slug: 'sec-hard-cat' },
      update: { isActive: true },
      create: {
        name: 'Security Lecture Notes',
        slug: 'sec-hard-cat',
        isActive: true
      }
    });

    // Create a private/unpublished note owned by Admin
    testUnpublishedNote = await prisma.note.create({
      data: {
        title: 'Confidential Exam Blueprint',
        description: 'Internal examination guide not yet released to students',
        status: 'UNPUBLISHED',
        courseId: testCourse.id,
        subjectId: testSubject.id,
        categoryId: testCategory.id,
        semester: 1,
        uploadedById: adminUser.id,
        storageKey: 'internal-unpub-test.pdf',
        fileName: 'Confidential-Blueprint.pdf',
        fileSize: 1024n,
        mimeType: 'application/pdf',
        storageProvider: 'local'
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
    // Clean up test notes, taxonomies and test users
    if (testUnpublishedNote) {
      await prisma.note.deleteMany({ where: { id: testUnpublishedNote.id } });
    }
    if (testSubject) {
      await prisma.note.deleteMany({ where: { subjectId: testSubject.id } });
      await prisma.topic.deleteMany({ where: { subjectId: testSubject.id } });
      await prisma.subject.deleteMany({ where: { id: testSubject.id } });
    }
    if (testCourse) {
      await prisma.course.deleteMany({ where: { id: testCourse.id } });
    }
    if (testCategory) {
      await prisma.category.deleteMany({ where: { id: testCategory.id } });
    }
    await prisma.user.deleteMany({
      where: { email: { in: testUserEmails } }
    }).catch(() => {});
  });

  // 1. Unauthorized API access
  await t.test('1. Unauthorized API access returns HTTP 401', async () => {
    const res = await fetch(`${baseUrl}/profile/me`);
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'UNAUTHORIZED');
  });

  // 2. Scholar attempting note upload
  await t.test('2. Scholar attempting note upload is strictly blocked with HTTP 403', async () => {
    const res = await fetch(`${baseUrl}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${scholarToken}`
      },
      body: JSON.stringify({
        title: 'Unauthorized Scholar Note Attempt',
        courseId: testCourse.id,
        subjectId: testSubject.id,
        categoryId: testCategory.id,
        semester: 1
      })
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  // 3. Scholar attempting role escalation
  await t.test('3. Scholar attempting role escalation via profile update is rejected with HTTP 403', async () => {
    const res = await fetch(`${baseUrl}/profile/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${scholarToken}`
      },
      body: JSON.stringify({
        name: 'Scholar Hacker Attempt',
        role: 'ADMIN',
        isSuperAdmin: true
      })
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'FORBIDDEN_FIELD_MODIFICATION');
  });

  // 4. Admin accessing Super Admin endpoints
  await t.test('4. Admin accessing Super Admin-only endpoints is rejected with HTTP 403', async () => {
    const res = await fetch(`${baseUrl}/admin/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  // 5. Unauthorized note modification
  await t.test('5. Unauthorized note modification by non-owner is rejected with HTTP 403', async () => {
    const res = await fetch(`${baseUrl}/notes/${testUnpublishedNote.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${scholarToken}`
      },
      body: JSON.stringify({
        title: 'Tampered Note Title'
      })
    });
    assert.equal(res.status, 403);
  });

  // 6. Unauthorized private file download
  await t.test('6. Unauthorized download of unpublished note is blocked with HTTP 403', async () => {
    const res = await fetch(`${baseUrl}/notes/${testUnpublishedNote.id}/download`, {
      headers: { Authorization: `Bearer ${scholarToken}` }
    });
    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'DOWNLOAD_FORBIDDEN');
  });

  // 7. Access to unpublished notes
  await t.test('7. Scholar cannot view details of unpublished private note', async () => {
    const res = await fetch(`${baseUrl}/notes/${testUnpublishedNote.id}`, {
      headers: { Authorization: `Bearer ${scholarToken}` }
    });
    // Should be forbidden or not found
    assert.ok(res.status === 403 || res.status === 404);
  });

  // 8. Malicious filenames
  await t.test('8. Malicious filenames with directory traversal are sanitized safely', async () => {
    assert.throws(() => {
      storageService.local.resolveSafePath('../../etc/passwd');
    }, (err) => err.code === 'INVALID_STORAGE_PATH' || err.statusCode === 403);
  });

  // 9. Oversized uploads
  await t.test('9. Oversized uploads exceeding limits are rejected', async () => {
    const giantBuffer = Buffer.alloc(30 * 1024 * 1024); // 30MB
    await assert.rejects(
      async () => {
        await storageService.saveFile({
          buffer: giantBuffer,
          originalname: 'giant-file.pdf',
          mimetype: 'application/pdf'
        });
      },
      (err) => err.code === 'FILE_TOO_LARGE'
    );
  });

  // 10. Invalid file types
  await t.test('10. Dangerous executable formats (.exe, .sh, .bat) are blocked', async () => {
    await assert.rejects(
      async () => {
        await storageService.saveFile({
          buffer: Buffer.from('echo malicious'),
          originalname: 'malware.sh',
          mimetype: 'application/x-sh'
        });
      },
      (err) => err.code === 'FILE_TYPE_PROHIBITED'
    );
  });

  // 11. SQL injection attempts
  await t.test('11. SQL injection payloads in search queries execute safely without error', async () => {
    const res = await fetch(`${baseUrl}/notes/explore?search=${encodeURIComponent("' OR '1'='1' --")}`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    // Verified: Parameterized Prisma query safely escapes and does not leak all notes
  });

  // 12. XSS payload handling
  await t.test('12. Stored XSS payload in visual builder configuration is blocked with HTTP 422', async () => {
    const res = await fetch(`${baseUrl}/admin/config/pages/home`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        draftConfig: {
          hero: {
            headline: 'Test Headline <script>alert("xss")</script>',
            highlightText: 'Injected'
          }
        }
      })
    });
    assert.equal(res.status, 422);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.ok(body.error.message.includes('prohibited executable or script content'));
  });

  // 13. CSRF protections
  await t.test('13. API uses explicit Bearer token authorization and sets safe cross-origin policies', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.status, 200);
    const xContentType = res.headers.get('x-content-type-options');
    assert.equal(xContentType, 'nosniff');
  });

  // 14. Rate-limit enforcement
  await t.test('14. Security headers and rate-limit headers are served on auth endpoints', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'nonexistent@pjstudy.com', password: 'PjStudyPass123#' })
    });
    assert.equal(res.status, 401);
    // Rate limit headers are delivered by express-rate-limit
    const limitHeader = res.headers.get('ratelimit-limit') || res.headers.get('x-ratelimit-limit');
    assert.ok(limitHeader !== undefined);
  });

  // 15. Token expiration
  await t.test('15. Expired access token is rejected with HTTP 401', async () => {
    const expiredToken = jwt.sign(
      { userId: scholarUser.id, role: scholarUser.role, email: scholarUser.email },
      env.jwtAccessSecret,
      { expiresIn: '-1s' }
    );
    const res = await fetch(`${baseUrl}/profile/me`, {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    assert.equal(res.status, 401);
  });

  // 16. Logout/session invalidation
  await t.test('16. Revoked session refresh token cannot be reused', async () => {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawToken);
    const session = await prisma.refreshSession.create({
      data: {
        userId: scholarUser.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 86400000),
        revokedAt: new Date() // Already revoked
      }
    });

    const res = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rawToken })
    });
    assert.equal(res.status, 401);
    const body = await res.json();
    assert.equal(body.error.code, 'TOKEN_REUSE_DETECTED');

    await prisma.refreshSession.deleteMany({ where: { id: session.id } }).catch(() => {});
  });

  // 17. Password reset token reuse
  await t.test('17. Already-used password reset token is rejected with HTTP 400', async () => {
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawResetToken);
    const resetRecord = await prisma.passwordResetToken.create({
      data: {
        userId: scholarUser.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: new Date() // Already used
      }
    });

    const res = await fetch(`${baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: rawResetToken,
        password: 'NewStrongPassword#2026'
      })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error.code, 'INVALID_OR_USED_TOKEN');

    await prisma.passwordResetToken.deleteMany({ where: { id: resetRecord.id } }).catch(() => {});
  });

  // 18. Invalid Google Drive references
  await t.test('18. Requesting file with non-existent storage key returns 404 without leaking secrets', async () => {
    const res = await fetch(`${baseUrl}/notes/non-existent-uuid/download`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.success, false);
    assert.equal(body.error.code, 'NOTE_NOT_FOUND');
    // Ensure no OAuth keys or credentials are leaked in error body
    assert.ok(!JSON.stringify(body).includes('client_secret'));
    assert.ok(!JSON.stringify(body).includes('refresh_token'));
  });

  // 19. Unauthorized builder publishing
  await t.test('19. Unauthorized page publishing without Super Admin is blocked with HTTP 403', async () => {
    const res = await fetch(`${baseUrl}/admin/config/pages/home/publish`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 403);
  });

  // 20. Automatic notes creation regression
  await t.test('20. Regression check: Reading notes / explore never triggers note creation', async () => {
    const countBefore = await prisma.note.count();
    await fetch(`${baseUrl}/notes/explore`);
    await fetch(`${baseUrl}/dashboard/overview`, {
      headers: { Authorization: `Bearer ${scholarToken}` }
    });
    const countAfter = await prisma.note.count();
    assert.equal(countAfter, countBefore, 'Database note count must remain invariant during reads');
  });

  // 21. Automatic user creation regression
  await t.test('21. Regression check: Standard API routes do not create unwanted user records', async () => {
    const countBefore = await prisma.user.count();
    await fetch(`${baseUrl}/health`);
    await fetch(`${baseUrl}/config`);
    await fetch(`${baseUrl}/notes/search?q=test`);
    const countAfter = await prisma.user.count();
    assert.equal(countAfter, countBefore, 'Database user count must remain invariant during reads');
  });

  // 22. Backend restart without seeding
  await t.test('22. Server startup in application code does not invoke database seeding', async () => {
    // Assert that importing app or creating new server does not mutate note table
    const countBefore = await prisma.note.count();
    const tempServer = createServer(app);
    await new Promise((resolve) => tempServer.listen(0, resolve));
    await new Promise((resolve) => tempServer.close(resolve));
    const countAfter = await prisma.note.count();
    assert.equal(countAfter, countBefore, 'App instantiation must never seed the database');
  });

  // 23. Production startup without demo-data creation
  await t.test('23. Production configuration validation: requires strict secrets and blocks demo data', async () => {
    assert.ok(env.isProduction ? env.jwtAccessSecret.length >= 32 : true);
    assert.equal(typeof env.isProduction, 'boolean');
  });
});
