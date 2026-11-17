import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'http';
import app from '../src/app.js';
import swaggerSpec from '../src/docs/swaggerSpec.js';
import { checkDocsAccess } from '../src/docs/swagger.routes.js';

test('PJ Study Swagger UI, OpenAPI 3.0.3 Specification & API Testing System', async (t) => {
  let server;
  let baseUrl;

  t.before(async () => {
    server = createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}`;
  });

  t.after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  await t.test('1. GET /api-docs.json delivers valid OpenAPI 3.0.3 specification', async () => {
    const res = await fetch(`${baseUrl}/api-docs.json`);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type')?.includes('application/json'));

    const spec = await res.json();
    assert.equal(spec.openapi, '3.0.3');
    assert.ok(spec.info?.title.includes('PJ Study'));
    assert.equal(spec.info?.version, '1.0.0');
    assert.ok(spec.servers && spec.servers.length >= 2);
    assert.ok(spec.tags && spec.tags.length >= 10);
    assert.ok(Object.keys(spec.paths).length >= 50);

    // Schemas verification
    assert.ok(spec.components?.schemas?.Note);
    assert.ok(spec.components?.schemas?.User);
    assert.ok(spec.components?.schemas?.Course);
    assert.ok(spec.components?.schemas?.Subject);
    assert.ok(spec.components?.schemas?.Category);
    assert.ok(spec.components?.schemas?.Review);
    assert.ok(spec.components?.schemas?.Notification);
    assert.ok(spec.components?.schemas?.PlatformSettings);
    assert.ok(spec.components?.schemas?.StorageStatus);
    assert.ok(spec.components?.schemas?.AuditLog);

    // Security definition verification
    assert.ok(spec.components?.securitySchemes?.bearerAuth);
    assert.equal(spec.components.securitySchemes.bearerAuth.type, 'http');
    assert.equal(spec.components.securitySchemes.bearerAuth.scheme, 'bearer');
    assert.ok(spec.components?.securitySchemes?.cookieAuth);
  });

  await t.test('2. GET /api-docs/ serves branded interactive Swagger UI explorer', async () => {
    const res = await fetch(`${baseUrl}/api-docs/`);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type')?.includes('text/html'));
    const html = await res.text();
    assert.ok(html.includes('swagger-ui'));
    assert.ok(html.includes('PJ Study'));
  });

  await t.test('3. Backward-compatible /api/docs.json and /api/docs/ serve the same spec and UI', async () => {
    const resJson = await fetch(`${baseUrl}/api/docs.json`);
    assert.equal(resJson.status, 200);
    const spec = await resJson.json();
    assert.equal(spec.openapi, '3.0.3');

    const resHtml = await fetch(`${baseUrl}/api/docs/`);
    assert.equal(resHtml.status, 200);
    assert.ok(resHtml.headers.get('content-type')?.includes('text/html'));
  });

  await t.test('4. Top-level redirects and trailing slash routes lead to Swagger UI', async () => {
    // /docs sends trailing slash redirect to /docs/ where UI is mounted
    const resDocs = await fetch(`${baseUrl}/docs`, { redirect: 'manual' });
    assert.ok([301, 302].includes(resDocs.status));
    assert.ok(resDocs.headers.get('location')?.includes('docs'));

    // /swagger redirects to /api-docs/
    const resSwagger = await fetch(`${baseUrl}/swagger`, { redirect: 'manual' });
    assert.equal(resSwagger.status, 302);
    assert.equal(resSwagger.headers.get('location'), '/api-docs/');

    // /api/v1/docs redirects to /api-docs/
    const resApiV1Docs = await fetch(`${baseUrl}/api/v1/docs`, { redirect: 'manual' });
    assert.equal(resApiV1Docs.status, 302);
    assert.equal(resApiV1Docs.headers.get('location'), '/api-docs/');

    // /api/v1/api-docs redirects to /api-docs/
    const resApiV1ApiDocs = await fetch(`${baseUrl}/api/v1/api-docs`, { redirect: 'manual' });
    assert.equal(resApiV1ApiDocs.status, 302);
    assert.equal(resApiV1ApiDocs.headers.get('location'), '/api-docs/');
  });

  await t.test('5. OpenAPI Specification internal integrity: Zero broken $ref pointers', async () => {
    const schemas = swaggerSpec.components.schemas;
    const paths = swaggerSpec.paths;
    const brokenRefs = [];

    function checkRefs(obj, pathLoc) {
      if (!obj || typeof obj !== 'object') return;
      if (obj.$ref) {
        const ref = obj.$ref;
        if (ref.startsWith('#/components/schemas/')) {
          const name = ref.replace('#/components/schemas/', '');
          if (!schemas[name]) {
            brokenRefs.push(`${pathLoc} -> ${ref}`);
          }
        }
      }
      for (const [k, v] of Object.entries(obj)) {
        checkRefs(v, `${pathLoc}.${k}`);
      }
    }

    checkRefs(schemas, 'components.schemas');
    checkRefs(paths, 'paths');

    assert.equal(brokenRefs.length, 0, `Found broken $ref references: ${brokenRefs.join(', ')}`);
  });

  await t.test('6. Production Security Guard: checkDocsAccess blocks access in production when disabled', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalEnable = process.env.ENABLE_SWAGGER;

    try {
      process.env.NODE_ENV = 'production';
      delete process.env.ENABLE_SWAGGER;
      delete process.env.SWAGGER_ENABLED;

      let statusCode = null;
      let jsonPayload = null;
      const fakeReq = { headers: {}, query: {} };
      const fakeRes = {
        status(code) {
          statusCode = code;
          return this;
        },
        json(data) {
          jsonPayload = data;
          return this;
        }
      };

      let calledNext = false;
      checkDocsAccess(fakeReq, fakeRes, () => {
        calledNext = true;
      });

      assert.equal(calledNext, false);
      assert.equal(statusCode, 403);
      assert.equal(jsonPayload?.error?.code, 'DOCS_DISABLED');

      // Now verify enabling with env flag allows access in production
      process.env.ENABLE_SWAGGER = 'true';
      let prodAllowed = false;
      checkDocsAccess(fakeReq, fakeRes, () => {
        prodAllowed = true;
      });
      assert.equal(prodAllowed, true);
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
      if (originalEnable !== undefined) {
        process.env.ENABLE_SWAGGER = originalEnable;
      } else {
        delete process.env.ENABLE_SWAGGER;
      }
    }
  });
});
