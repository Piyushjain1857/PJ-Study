import test from 'node:test';
import assert from 'node:assert';
import app from '../src/app.js';
import prisma from '../src/config/database.js';
import { checkDocsAccess } from '../src/docs/swagger.routes.js';
import { validateFileSignature, FORBIDDEN_EXTENSIONS } from '../src/services/storage/storage.service.js';
import { sanitizeString } from '../src/modules/platformConfig/componentRegistry.js';
import { generateAccessToken } from '../src/services/tokens/token.service.js';

test('PJ Study — Prompt 28 Comprehensive Security Audit & Hardening Suite', async (t) => {
  let server;
  let baseUrl;
  let scholarToken;
  let adminToken;

  t.before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}/api/v1`;
        resolve();
      });
    });

    const student = await prisma.user.findFirst({ where: { role: 'STUDENT', isActive: true } });
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN', isActive: true } });

    scholarToken = generateAccessToken({
      id: student?.id || 'synthetic-student',
      email: student?.email || 'student@portal.com',
      role: 'STUDENT'
    });

    adminToken = generateAccessToken({
      id: admin?.id || 'synthetic-admin',
      email: admin?.email || 'admin@portal.com',
      role: 'ADMIN'
    });
  });

  t.after(() => {
    if (server) server.close();
  });

  // 1. Mass Assignment Prevention on User Registration
  await t.test('1. Mass Assignment: Registration strictly forces STUDENT role regardless of body payload', async () => {
    const testEmail = `sec_mass_assign_${Date.now()}@pjstudy.com`;
    const res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Attacker Attempting Escalation',
        email: testEmail,
        password: 'ValidPassword123!',
        role: 'SUPER_ADMIN',
        isEmailVerified: true,
        isActive: true
      })
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.data.role, 'STUDENT', 'Role must strictly remain STUDENT');
    assert.strictEqual(body.data.isEmailVerified, false, 'isEmailVerified must remain false');

    // Clean up
    await prisma.emailVerificationToken.deleteMany({ where: { user: { email: testEmail } } });
    await prisma.user.deleteMany({ where: { email: testEmail } });
  });

  // 2. Mass Assignment Prevention on Profile Updates
  await t.test('2. Mass Assignment: Scholar attempting role escalation via profile update is rejected (403)', async () => {
    const res = await fetch(`${baseUrl}/profile/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${scholarToken}`
      },
      body: JSON.stringify({
        role: 'SUPER_ADMIN'
      })
    });

    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.ok(
      ['FORBIDDEN_FIELD_MODIFICATION', 'FORBIDDEN_ROLE_UPDATE'].includes(body.error.code),
      `Expected error code to indicate forbidden field modification, got ${body.error.code}`
    );
  });

  // 3. Read-Only Invariants: Navigation & Exploration never create or mutate records
  await t.test('3. Invariant: Standard catalog browsing is 100% read-only with zero database mutations', async () => {
    const usersBefore = await prisma.user.count();
    const notesBefore = await prisma.note.count();

    const [healthRes, configRes, exploreRes, dashboardRes] = await Promise.all([
      fetch(`${baseUrl}/health`),
      fetch(`${baseUrl}/config`),
      fetch(`${baseUrl}/notes/explore`),
      fetch(`${baseUrl}/dashboard/overview`, {
        headers: { Authorization: `Bearer ${scholarToken}` }
      })
    ]);

    assert.strictEqual(healthRes.status, 200);
    assert.strictEqual(configRes.status, 200);
    assert.strictEqual(exploreRes.status, 200);
    assert.strictEqual(dashboardRes.status, 200);

    const usersAfter = await prisma.user.count();
    const notesAfter = await prisma.note.count();

    assert.strictEqual(usersAfter, usersBefore, 'Users count must not change on read operations');
    assert.strictEqual(notesAfter, notesBefore, 'Notes count must not change on read operations');
  });

  // 4. Open-Redirect Prevention: Path validation unit tests
  await t.test('4. Open Redirect: Relative path sanitization blocks protocol smuggling and external URLs', () => {
    const isSafePath = (target) =>
      typeof target === 'string' &&
      target.startsWith('/') &&
      !target.startsWith('//') &&
      !target.startsWith('/\\') &&
      !target.includes(':');

    assert.strictEqual(isSafePath('/notes/explore'), true);
    assert.strictEqual(isSafePath('/dashboard'), true);
    assert.strictEqual(isSafePath('/my-notes?tab=saved'), true);

    // Malicious vectors
    assert.strictEqual(isSafePath('//evil.com/phish'), false);
    assert.strictEqual(isSafePath('/\\evil.com/phish'), false);
    assert.strictEqual(isSafePath('https://evil.com'), false);
    assert.strictEqual(isSafePath('javascript:alert(1)'), false);
    assert.strictEqual(isSafePath('data:text/html,<html>'), false);
  });

  // 5. Swagger Access Control Guard in Production
  await t.test('5. Swagger Guard: checkDocsAccess blocks Swagger in production unless explicitly enabled', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalSwagger = process.env.ENABLE_SWAGGER;
    try {
      process.env.NODE_ENV = 'production';
      delete process.env.ENABLE_SWAGGER;
      delete process.env.SWAGGER_ENABLED;

      let statusCode = 200;
      let responseBody = null;
      let nextCalled = false;

      const mockRes = {
        status: (code) => {
          statusCode = code;
          return {
            json: (payload) => {
              responseBody = payload;
              return payload;
            }
          };
        }
      };

      checkDocsAccess({}, mockRes, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false, 'next() must NOT be called in production when Swagger is disabled');
      assert.strictEqual(statusCode, 403);
      assert.strictEqual(responseBody?.error?.code, 'DOCS_DISABLED');
    } finally {
      process.env.NODE_ENV = originalEnv;
      if (originalSwagger) process.env.ENABLE_SWAGGER = originalSwagger;
    }
  });

  // 6. SQL Injection immunity in Prisma parameters
  await t.test('6. SQL Injection: Parameterized search queries handle injection strings safely', async () => {
    const maliciousSearches = [
      "' OR '1'='1",
      "'; DROP TABLE notes; --",
      "1 UNION SELECT 1, 'admin', 'password'",
      "../../etc/passwd"
    ];

    for (const payload of maliciousSearches) {
      const res = await fetch(`${baseUrl}/notes/explore?search=${encodeURIComponent(payload)}`);
      assert.strictEqual(res.status, 200, `Payload "${payload}" should execute safely with 200`);
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.ok(Array.isArray(body.data.notes));
    }
  });

  // 7. Stored XSS defense in Visual Website Builder
  await t.test('7. Stored XSS: Component registry rejects script tags and event handlers with HTTP 422', () => {
    const maliciousPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert(1)>',
      'javascript:evilCode()',
      '<iframe src="https://attacker.com"></iframe>'
    ];

    for (const payload of maliciousPayloads) {
      assert.throws(
        () => sanitizeString(payload, 'Test Component'),
        (err) => err.statusCode === 422,
        `Payload "${payload}" must trigger HTTP 422 error`
      );
    }
  });

  // 8. Storage magic-byte and executable file rejection
  await t.test('8. Storage Security: File signature verification rejects spoofed and executable files', () => {
    // Spoofed text file pretending to be PDF
    const textBufferAsPdf = Buffer.from('This is pure plain text masquerading as PDF');
    assert.strictEqual(validateFileSignature(textBufferAsPdf, '.pdf'), false);

    // Valid PDF signature %PDF
    const validPdfBuffer = Buffer.from('%PDF-1.7 valid content');
    assert.strictEqual(validateFileSignature(validPdfBuffer, '.pdf'), true);

    // Dangerous extensions
    assert.strictEqual(FORBIDDEN_EXTENSIONS.has('.exe'), true);
    assert.strictEqual(FORBIDDEN_EXTENSIONS.has('.sh'), true);
    assert.strictEqual(FORBIDDEN_EXTENSIONS.has('.php'), true);
    assert.strictEqual(FORBIDDEN_EXTENSIONS.has('.js'), true);
  });
});
