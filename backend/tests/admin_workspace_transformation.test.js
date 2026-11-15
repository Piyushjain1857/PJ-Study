import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'http';
import prisma from '../src/config/database.js';
import app from '../src/app.js';
import { generateAccessToken } from '../src/services/tokens/token.service.js';

test('PJ Study Complete Admin Role & Workspace Transformation Test Suite', async (t) => {
  let server;
  let baseUrl;

  let scholarUser;
  let adminUser;
  let superAdminUser;

  let scholarToken;
  let adminToken;
  let superAdminToken;

  t.before(async () => {
    server = createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api/v1`;

    scholarUser = await prisma.user.upsert({
      where: { email: 'trans_scholar@pjstudy.com' },
      update: { role: 'STUDENT', isActive: true },
      create: {
        name: 'Scholar Student',
        email: 'trans_scholar@pjstudy.com',
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLM',
        role: 'STUDENT',
        isActive: true,
        isEmailVerified: true
      }
    });

    // Admin user (former moderator)
    adminUser = await prisma.user.upsert({
      where: { email: 'trans_admin@pjstudy.com' },
      update: { role: 'ADMIN', isActive: true },
      create: {
        name: 'Academic Admin',
        email: 'trans_admin@pjstudy.com',
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLM',
        role: 'ADMIN',
        isActive: true,
        isEmailVerified: true
      }
    });

    superAdminUser = await prisma.user.upsert({
      where: { email: 'trans_superadmin@pjstudy.com' },
      update: { role: 'SUPER_ADMIN', isActive: true },
      create: {
        name: 'Command Super Admin',
        email: 'trans_superadmin@pjstudy.com',
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLM',
        role: 'SUPER_ADMIN',
        isActive: true,
        isEmailVerified: true
      }
    });

    scholarToken = generateAccessToken(scholarUser);
    adminToken = generateAccessToken(adminUser);
    superAdminToken = generateAccessToken(superAdminUser);
  });

  t.after(async () => {
    await prisma.user.deleteMany({
      where: {
        email: { in: ['trans_scholar@pjstudy.com', 'trans_admin@pjstudy.com', 'trans_superadmin@pjstudy.com'] }
      }
    });
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // 1. Scholar blocked from Admin Workspace
  await t.test('1. RBAC Guard: Scholar is forbidden from Admin Workspace (HTTP 403)', async () => {
    const endpoints = [
      '/admin-workspace/overview',
      '/admin-workspace/analytics',
      '/admin-workspace/queue',
      '/admin-workspace/reports',
      '/admin-workspace/history'
    ];

    for (const ep of endpoints) {
      const res = await fetch(`${baseUrl}${ep}`, {
        headers: { Authorization: `Bearer ${scholarToken}` }
      });
      assert.equal(res.status, 403, `Scholar must be blocked from ${ep}`);
    }
  });

  // 2. Admin can access Admin Workspace Overview
  await t.test('2. Admin can access GET /admin-workspace/overview with scoped metrics', async () => {
    const res = await fetch(`${baseUrl}/admin-workspace/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(typeof body.data.myUploadedNotes, 'number');
    assert.equal(typeof body.data.approvedNotes, 'number');
    assert.equal(typeof body.data.rejectedNotes, 'number');
    assert.equal(typeof body.data.assignedNotes, 'number');
    assert.equal(typeof body.data.pendingReviews, 'number');
    assert.equal(typeof body.data.totalDownloads, 'number');
    assert.ok(Array.isArray(body.data.recentUploads));
    assert.ok(Array.isArray(body.data.recentActivity));
  });

  // 3. Admin can access Admin Workspace Analytics
  await t.test('3. Admin can access GET /admin-workspace/analytics with scoped breakdown', async () => {
    const res = await fetch(`${baseUrl}/admin-workspace/analytics`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(typeof body.data.approvalRate, 'number');
    assert.ok(body.data.statusBreakdown);
    assert.ok(Array.isArray(body.data.recentContentActions));
  });

  // 4. Admin can access Moderation Queue
  await t.test('4. Admin can access GET /admin-workspace/queue for manuscripts review', async () => {
    const res = await fetch(`${baseUrl}/admin-workspace/queue`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.notes));
    assert.ok(body.data.pagination);
  });

  // 5. Admin can access Content Reports
  await t.test('5. Admin can access GET /admin-workspace/reports for review', async () => {
    const res = await fetch(`${baseUrl}/admin-workspace/reports`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.reports));
    assert.ok(body.data.pagination);
  });

  // 6. Admin can access Moderation History
  await t.test('6. Admin can access GET /admin-workspace/history', async () => {
    const res = await fetch(`${baseUrl}/admin-workspace/history`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.history));
    assert.ok(body.data.pagination);
  });

  // 7. Admin cannot access Super Admin-only endpoints
  await t.test('7. Admin is forbidden from Super Admin Command Center (HTTP 403)', async () => {
    const superEndpoints = [
      '/admin/overview',
      '/admin/users',
      '/admin/moderators',
      '/admin/admins',
      '/admin/settings',
      '/admin/health',
      '/admin/backups'
    ];

    for (const ep of superEndpoints) {
      const res = await fetch(`${baseUrl}${ep}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 403, `Admin must be blocked from Super Admin endpoint ${ep}`);
    }
  });

  // 8. Admin cannot assign roles
  await t.test('8. Admin cannot assign roles (HTTP 403)', async () => {
    const res = await fetch(`${baseUrl}/admin/users/${scholarUser.id}/role`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: 'ADMIN' })
    });
    assert.equal(res.status, 403);
  });

  // 9. Super Admin can manage Admin accounts
  await t.test('9. Super Admin can access GET /admin/admins and GET /admin/overview', async () => {
    const res = await fetch(`${baseUrl}/admin/admins`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data.data));

    const overviewRes = await fetch(`${baseUrl}/admin/overview`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(overviewRes.status, 200);
    const overviewBody = await overviewRes.json();
    assert.equal(overviewBody.success, true);
    assert.equal(typeof overviewBody.data.activeAdmins, 'number');
  });
});
