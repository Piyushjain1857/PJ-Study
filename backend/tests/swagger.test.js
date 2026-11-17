import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'http';
import app from '../src/app.js';
import swaggerSpec from '../src/docs/swaggerSpec.js';

test('PJ Study Swagger & OpenAPI 3.0 Documentation Suite', async (t) => {
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

  await t.test('1. GET /api/docs.json delivers valid OpenAPI 3.0 specification', async () => {
    const res = await fetch(`${baseUrl}/api/docs.json`);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type')?.includes('application/json'));

    const spec = await res.json();
    assert.equal(spec.openapi, '3.0.3');
    assert.equal(spec.info?.title, 'PJ Study API');
    assert.ok(spec.paths);
    assert.ok(spec.components?.schemas?.Note);
    assert.ok(spec.components?.schemas?.User);
    assert.ok(spec.components?.securitySchemes?.bearerAuth);
  });

  await t.test('2. GET /api/docs/ serves Swagger UI documentation explorer', async () => {
    const res = await fetch(`${baseUrl}/api/docs/`);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type')?.includes('text/html'));
    const html = await res.text();
    assert.ok(html.includes('swagger-ui'));
    assert.ok(html.includes('PJ Study'));
  });

  await t.test('3. Top-level redirects (/docs and /api/v1/docs) route to /api/docs', async () => {
    const res1 = await fetch(`${baseUrl}/docs`, { redirect: 'manual' });
    assert.equal(res1.status, 302);
    assert.equal(res1.headers.get('location'), '/api/docs');

    const res2 = await fetch(`${baseUrl}/api/v1/docs`, { redirect: 'manual' });
    assert.equal(res2.status, 302);
    assert.equal(res2.headers.get('location'), '/api/docs');
  });
});
