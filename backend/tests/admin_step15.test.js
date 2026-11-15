import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import prisma from '../src/config/database.js';
import { generateAccessToken } from '../src/services/tokens/token.service.js';
import { ROLES } from '../src/auth/rolePermissions.js';

let server;
let baseUrl;

let studentToken;
let moderatorToken;
let adminToken;
let superAdminToken;

let studentUser;
let moderatorUser;
let adminUser;
let superAdminUser;

test.before(async () => {
  server = app.listen(0);
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}/api/v1`;

  // Fetch or create users
  studentUser = await prisma.user.findFirst({ where: { role: ROLES.STUDENT } });
  moderatorUser = await prisma.user.findFirst({ where: { role: ROLES.MODERATOR } });
  adminUser = await prisma.user.findFirst({ where: { role: ROLES.ADMIN } });
  superAdminUser = await prisma.user.findFirst({ where: { role: ROLES.SUPER_ADMIN } });

  studentToken = generateAccessToken({
    id: studentUser.id,
    email: studentUser.email,
    role: studentUser.role
  });
  moderatorToken = generateAccessToken({
    id: moderatorUser.id,
    email: moderatorUser.email,
    role: moderatorUser.role
  });
  adminToken = generateAccessToken({
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role
  });
  superAdminToken = generateAccessToken({
    id: superAdminUser.id,
    email: superAdminUser.email,
    role: superAdminUser.role
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('Super Admin Control Center & Platform Management (Step 15)', async (t) => {
  await t.test('1. RBAC Guard: Scholar is forbidden from all admin routes (HTTP 403)', async () => {
    const endpoints = [
      '/admin/overview',
      '/admin/analytics',
      '/admin/users',
      '/admin/moderators',
      '/admin/notes',
      '/admin/academics',
      '/admin/settings'
    ];

    for (const ep of endpoints) {
      const res = await fetch(`${baseUrl}${ep}`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      assert.equal(
        res.status,
        403,
        `Scholar should be forbidden from accessing ${ep}, got ${res.status}`
      );
    }
  });

  await t.test('2. RBAC Guard: Moderator is forbidden from user, note management, and settings (HTTP 403)', async () => {
    const endpoints = [
      '/admin/overview',
      '/admin/users',
      '/admin/moderators',
      '/admin/notes',
      '/admin/academics',
      '/admin/settings'
    ];

    for (const ep of endpoints) {
      const res = await fetch(`${baseUrl}${ep}`, {
        headers: { Authorization: `Bearer ${moderatorToken}` }
      });
      assert.equal(
        res.status,
        403,
        `Moderator should be forbidden from accessing ${ep}, got ${res.status}`
      );
    }
  });

  await t.test('3. GET /admin/overview returns 8 genuine database metrics for Super Admin', async () => {
    const res = await fetch(`${baseUrl}/admin/overview`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.success, true);
    const data = body.data;

    // Check the required 8 KPI metrics
    assert.equal(typeof data.totalUsers, 'number');
    assert.equal(typeof data.activeScholars, 'number');
    assert.equal(typeof data.activeModerators, 'number');
    assert.equal(typeof data.totalNotes, 'number');
    assert.equal(typeof data.approvedNotes, 'number');
    assert.equal(typeof data.pendingModeration, 'number');
    assert.equal(typeof data.totalDownloads, 'number');
    assert.equal(typeof data.reportedContent, 'number');
    assert.ok(data.roles);
    assert.equal(typeof data.roles.STUDENT, 'number');
    assert.equal(typeof data.roles.MODERATOR, 'number');
    assert.equal(typeof data.roles.SUPER_ADMIN, 'number');
  });

  await t.test('4. GET /admin/analytics returns time-series trends and aggregation', async () => {
    const res = await fetch(`${baseUrl}/admin/analytics?range=30d`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(res.status, 200);

    const body = await res.json();
    const data = body.data;
    assert.equal(data.range, '30d');
    assert.ok(Array.isArray(data.timeline));
    assert.equal(data.timeline.length, 30);
    assert.equal(typeof data.timeline[0].registrations, 'number');
    assert.equal(typeof data.timeline[0].notes, 'number');
    assert.equal(typeof data.timeline[0].downloads, 'number');
    assert.ok(Array.isArray(data.topNotes));
    assert.ok(Array.isArray(data.categories));
    assert.ok(data.moderationWorkload);
  });

  await t.test('5. GET /admin/moderators returns staff list with contribution counts', async () => {
    const res = await fetch(`${baseUrl}/admin/moderators`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.ok(Array.isArray(body.data.items));
    assert.ok(body.data.items.length > 0);
    const firstMod = body.data.items[0];
    assert.ok(firstMod.name);
    assert.ok(firstMod.email);
    assert.equal(typeof firstMod.notesUploaded, 'number');
    assert.equal(typeof firstMod.decisionsCount, 'number');
  });

  await t.test('6. GET /admin/notes returns notes across all statuses with pagination', async () => {
    const res = await fetch(`${baseUrl}/admin/notes?status=ALL&limit=5`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.ok(Array.isArray(body.data.items));
    assert.ok(body.data.pagination);
  });

  await t.test('7. GET /admin/academics returns courses, subjects, categories taxonomy', async () => {
    const res = await fetch(`${baseUrl}/admin/academics`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(res.status, 200);

    const body = await res.json();
    const data = body.data;
    assert.ok(Array.isArray(data.courses));
    assert.ok(Array.isArray(data.subjects));
    assert.ok(Array.isArray(data.categories));
  });

  await t.test('8. Academic Management: Create and update Course by Super Admin', async () => {
    const courseName = `Automated Test Course ${Date.now()}`;
    const createRes = await fetch(`${baseUrl}/admin/academics/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        name: courseName,
        description: 'Test course for Step 15'
      })
    });
    assert.equal(createRes.status, 201);
    const created = (await createRes.json()).data;
    assert.ok(created.id);
    assert.equal(created.name, courseName);

    // Update
    const updateRes = await fetch(`${baseUrl}/admin/academics/courses/${created.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        name: `${courseName} Updated`
      })
    });
    assert.equal(updateRes.status, 200);
    const updated = (await updateRes.json()).data;
    assert.equal(updated.name, `${courseName} Updated`);

    // Cleanup
    await prisma.course.delete({ where: { id: created.id } });
  });

  await t.test('9. GET and PATCH /admin/settings: Only Super Admin can update settings', async () => {
    // Admin cannot update settings (requires SUPER_ADMIN)
    const adminAttempt = await fetch(`${baseUrl}/admin/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ platformName: 'Hacked Name' })
    });
    assert.equal(adminAttempt.status, 403);

    // Super Admin can fetch settings
    const getRes = await fetch(`${baseUrl}/admin/settings`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(getRes.status, 200);
    const settings = (await getRes.json()).data;
    assert.ok(settings.platformName);
    assert.ok(settings.maxUploadSizeMb);

    // Super Admin updates settings with validation
    const updateRes = await fetch(`${baseUrl}/admin/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        platformName: 'PJ Study Enterprise',
        maxUploadSizeMb: '30'
      })
    });
    assert.equal(updateRes.status, 200);
    const updated = (await updateRes.json()).data;
    assert.equal(updated.platformName, 'PJ Study Enterprise');
    assert.equal(updated.maxUploadSizeMb, '30');

    // Restore default
    await fetch(`${baseUrl}/admin/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        platformName: 'PJ Study',
        maxUploadSizeMb: '25'
      })
    });
  });

  await t.test('10. Super Admin Account Safety: Prevent removing last active Super Admin', async () => {
    // Attempting to demote the only super admin must return 400
    const attempt = await fetch(`${baseUrl}/admin/users/${superAdminUser.id}/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        role: ROLES.STUDENT,
        reason: 'Demote last super admin test'
      })
    });

    const activeSuperAdmins = await prisma.user.count({
      where: { role: ROLES.SUPER_ADMIN, isActive: true }
    });

    if (activeSuperAdmins <= 1) {
      assert.equal(attempt.status, 400);
      const resBody = await attempt.json();
      assert.match(resBody.error?.message || resBody.message, /last active Super Admin/i);
    }
  });
});
