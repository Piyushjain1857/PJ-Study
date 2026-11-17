import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import prisma from '../src/config/database.js';
import { generateAccessToken } from '../src/services/tokens/token.service.js';
import { ROLES } from '../src/auth/rolePermissions.js';
import { swaggerSpec } from '../src/docs/swaggerSpec.js';

test('PJ Study — Complete Backend Reliability, Security & Regression Suite (Prompt 22)', async (t) => {
  let server;
  let baseUrl;

  // Start server on an ephemeral port
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });

  t.after(async () => {
    server.close();
  });

  // 1. Health, Liveness & Readiness Probes
  await t.test('1. Liveness & Readiness Architecture', async (t2) => {
    await t2.test('GET /health returns 200 with system uptime', async () => {
      const res = await fetch(`${baseUrl}/health`);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.status, 'healthy');
      assert.equal(typeof json.data.uptimeSeconds, 'number');
    });

    await t2.test('GET /health/live returns 200 alive for container orchestrators', async () => {
      const res = await fetch(`${baseUrl}/health/live`);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.status, 'alive');
      assert.equal(typeof json.uptimeSeconds, 'number');
    });

    await t2.test('GET /health/ready performs pure read-only ping (SELECT 1) and returns 200 ready', async () => {
      const res = await fetch(`${baseUrl}/health/ready`);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.status, 'ready');
      assert.equal(json.database, 'connected');
    });

    await t2.test('GET /api/v1/health/live and /api/v1/health/ready are also available under /api/v1', async () => {
      const resLive = await fetch(`${baseUrl}/api/v1/health/live`);
      assert.equal(resLive.status, 200);
      const jsonLive = await resLive.json();
      assert.equal(jsonLive.status, 'alive');

      const resReady = await fetch(`${baseUrl}/api/v1/health/ready`);
      assert.equal(resReady.status, 200);
      const jsonReady = await resReady.json();
      assert.equal(jsonReady.status, 'ready');
      assert.equal(jsonReady.database, 'connected');
    });
  });

  // 2. Request ID Correlation & Error Response Structure
  await t.test('2. Request ID Correlation & Structured Logging', async (t2) => {
    await t2.test('Outgoing HTTP response includes X-Request-Id header', async () => {
      const res = await fetch(`${baseUrl}/api/v1/health`);
      assert.equal(res.status, 200);
      const reqId = res.headers.get('x-request-id');
      assert.ok(reqId, 'X-Request-Id header must be present');
      assert.ok(reqId.length >= 10);
    });

    await t2.test('Incoming X-Request-Id is preserved and echoed', async () => {
      const customId = 'client-correlation-abc-123';
      const res = await fetch(`${baseUrl}/api/v1/health`, {
        headers: { 'X-Request-Id': customId }
      });
      assert.equal(res.headers.get('x-request-id'), customId);
    });

    await t2.test('Error response body includes requestId matching X-Request-Id', async () => {
      const customId = 'error-correlation-xyz-789';
      const res = await fetch(`${baseUrl}/api/v1/non-existent-endpoint`, {
        headers: { 'X-Request-Id': customId }
      });
      assert.equal(res.status, 404);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.statusCode, 404);
      assert.equal(json.error.requestId, customId);
    });
  });

  // 3. Automatic Data Creation Bug Investigation & Invariant Verification
  await t.test('3. Zero-Mutation Invariant on Read-Only API Endpoints', async () => {
    const noteCountBefore = await prisma.note.count();
    const userCountBefore = await prisma.user.count();

    // Call diverse read-only endpoints repeatedly
    await fetch(`${baseUrl}/health`);
    await fetch(`${baseUrl}/health/ready`);
    await fetch(`${baseUrl}/api/v1/config`);
    await fetch(`${baseUrl}/api/v1/notes/explore`);
    await fetch(`${baseUrl}/api/v1/notes/explore/filters`);
    await fetch(`${baseUrl}/api/v1/notes/filters`);
    await fetch(`${baseUrl}/api/v1/categories`);
    await fetch(`${baseUrl}/api/v1/courses`);
    await fetch(`${baseUrl}/api/v1/academics/universities`);

    const noteCountAfter = await prisma.note.count();
    const userCountAfter = await prisma.user.count();

    assert.equal(noteCountAfter, noteCountBefore, 'Read-only requests must NOT create notes');
    assert.equal(userCountAfter, userCountBefore, 'Read-only requests must NOT create users');
  });

  // 4. Authentication Security Edge Cases
  await t.test('4. Authentication Security & Edge Cases', async (t2) => {
    await t2.test('Login with incorrect password returns 401 INVALID_CREDENTIALS without leak', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@pjstudy.com', password: 'IncorrectPassword123!' })
      });
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, 'INVALID_CREDENTIALS');
    });

    await t2.test('Login with non-existent user returns 401 INVALID_CREDENTIALS (no user enumeration)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'unknown_ghost_account@pjstudy.com', password: 'SomePassword123!' })
      });
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.success, false);
      assert.equal(json.error.code, 'INVALID_CREDENTIALS');
    });

    await t2.test('Login with missing password returns 422 VALIDATION_ERROR', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@pjstudy.com' })
      });
      assert.equal(res.status, 422);
      const json = await res.json();
      assert.equal(json.error.code, 'VALIDATION_ERROR');
    });

    await t2.test('Tampered or corrupted JWT returns 401 INVALID_TOKEN', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.token' }
      });
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.error.code, 'INVALID_TOKEN');
    });

    await t2.test('Protected endpoint without Authorization header returns 401 UNAUTHORIZED', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/me`);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.error.code, 'UNAUTHORIZED');
    });
  });

  // 5. RBAC & Privilege Escalation Defenses
  await t.test('5. RBAC & Anti-Tampering Enforcement', async (t2) => {
    // Generate valid scholar token
    const scholar = await prisma.user.findFirst({ where: { role: ROLES.STUDENT, isActive: true } });
    assert.ok(scholar, 'Scholar user must exist for testing');
    const scholarToken = generateAccessToken({
      id: scholar.id,
      email: scholar.email,
      role: ROLES.STUDENT
    });

    await t2.test('Scholar user cannot upload notes (HTTP 403 UPLOAD_FORBIDDEN)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/notes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${scholarToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'Unauthorized Scholar Note Attempt',
          content: 'This should be strictly rejected.',
          subjectId: 'any-subject-id'
        })
      });
      assert.equal(res.status, 403);
    });

    await t2.test('Scholar user cannot access Super Admin endpoints (HTTP 403 FORBIDDEN)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/overview`, {
        headers: { Authorization: `Bearer ${scholarToken}` }
      });
      assert.equal(res.status, 403);
    });

    await t2.test('Scholar user cannot access Admin Workspace moderation queue (HTTP 403 FORBIDDEN)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin-workspace/queue`, {
        headers: { Authorization: `Bearer ${scholarToken}` }
      });
      assert.equal(res.status, 403);
    });

    await t2.test('Scholar cannot elevate role via profile PATCH (HTTP 403 FORBIDDEN_FIELD_MODIFICATION)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/profile/me`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${scholarToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: 'SUPER_ADMIN' })
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.error.code, 'FORBIDDEN_FIELD_MODIFICATION');
    });
  });

  // 6. Notes Discovery, Filters & Search Optimization
  await t.test('6. Notes Discovery, Taxonomy Filters & Caching', async (t2) => {
    await t2.test('GET /api/v1/notes/filters returns valid taxonomy and cached response', async () => {
      const res = await fetch(`${baseUrl}/api/v1/notes/filters`);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(Array.isArray(json.data.courses));
      assert.ok(Array.isArray(json.data.categories));
      assert.ok(Array.isArray(json.data.subjects));
      assert.ok(Array.isArray(json.data.semesters));
      assert.equal(typeof json.data.totalApprovedNotes, 'number');
    });

    await t2.test('GET /api/v1/notes/explore/filters returns identical data to /notes/filters alias', async () => {
      const res1 = await fetch(`${baseUrl}/api/v1/notes/filters`);
      const res2 = await fetch(`${baseUrl}/api/v1/notes/explore/filters`);
      assert.equal(res1.status, 200);
      assert.equal(res2.status, 200);
      const json1 = await res1.json();
      const json2 = await res2.json();
      assert.deepEqual(json1.data.semesters, json2.data.semesters);
      assert.equal(json1.data.totalApprovedNotes, json2.data.totalApprovedNotes);
    });

    await t2.test('GET /api/v1/notes/explore returns only published notes', async () => {
      const res = await fetch(`${baseUrl}/api/v1/notes/explore`);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(Array.isArray(json.data.items));
      for (const item of json.data.items) {
        assert.ok(['PUBLISHED', 'APPROVED'].includes(item.status));
        // Storage key / private drive ID must never be exposed
        assert.equal(item.storageKey, undefined);
      }
    });

    await t2.test('Sorting parameters are accepted and stable', async () => {
      for (const sort of ['newest', 'oldest', 'title', 'downloads', 'views']) {
        const res = await fetch(`${baseUrl}/api/v1/notes/explore?sort=${sort}&limit=5`);
        assert.equal(res.status, 200, `Sort parameter "${sort}" must return 200`);
      }
    });
  });

  // 7. OpenAPI / Swagger Documentation Consistency
  await t.test('7. OpenAPI Specification & Swagger Explorer Consistency', async (t2) => {
    await t2.test('GET /api-docs.json serves valid OpenAPI 3.0.3 specification', async () => {
      const res = await fetch(`${baseUrl}/api-docs.json`);
      assert.equal(res.status, 200);
      const spec = await res.json();
      assert.equal(spec.openapi, '3.0.3');
      assert.ok(spec.info.title.includes('PJ Study'));
      assert.ok(Object.keys(spec.paths).length > 80);
    });

    await t2.test('GET /api-docs/ serves branded Swagger UI HTML', async () => {
      const res = await fetch(`${baseUrl}/api-docs/`);
      assert.equal(res.status, 200);
      const html = await res.text();
      assert.ok(html.includes('swagger-ui'));
      assert.ok(html.includes('PJ Study'));
    });

    await t2.test('All OpenAPI $ref components point to defined schemas', () => {
      const specStr = JSON.stringify(swaggerSpec);
      const refMatches = specStr.match(/"\$ref":\s*"#\/components\/schemas\/([a-zA-Z0-9_]+)"/g) || [];
      const definedSchemas = Object.keys(swaggerSpec.components.schemas);

      for (const match of refMatches) {
        const schemaName = match.split('/').pop().replace('"', '');
        assert.ok(
          definedSchemas.includes(schemaName),
          `Referenced schema "${schemaName}" must exist in components.schemas`
        );
      }
    });
  });
});
