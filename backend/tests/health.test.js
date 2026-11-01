import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';

test('Backend Health, Config, and Not-Found Endpoints', async (t) => {
  let server;
  let baseUrl;

  // Start test server on ephemeral port
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

  await t.test('GET /api/v1/health should return 200 and healthy status', async () => {
    const res = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.status, 'healthy');
    assert.equal(json.data.product, 'PJ Study');
    assert.ok(json.data.timestamp);
    assert.equal(typeof json.data.uptimeSeconds, 'number');
    assert.equal(json.data.environment, 'development');
    // Ensure no secrets are leaked
    assert.equal(json.data.databaseUrl, undefined);
    assert.equal(json.data.password, undefined);
  });

  await t.test('GET /api/v1/config should return centralized public configuration', async () => {
    const res = await fetch(`${baseUrl}/api/v1/config`);
    assert.equal(res.status, 200);

    const json = await res.json();
    assert.equal(json.success, true);
    assert.equal(json.data.product, 'PJ Study');
    assert.equal(json.data.tagline, 'Your Entire Study World, One Place.');
    assert.equal(json.data.version, '1.0.0');
    assert.equal(json.data.features.designSystem, 'active');
    assert.equal(json.data.databaseUrl, undefined);
  });

  await t.test('GET /unknown-route should return 404 with structured error', async () => {
    const res = await fetch(`${baseUrl}/unknown-route`);
    assert.equal(res.status, 404);

    const json = await res.json();
    assert.equal(json.success, false);
    assert.equal(json.error.statusCode, 404);
    assert.equal(json.error.code, 'NOT_FOUND');
    assert.ok(json.error.message.includes('Resource not found'));
  });
});
