import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import prisma from '../src/config/database.js';
import { generateAccessToken } from '../src/services/tokens/token.service.js';
import { ROLES } from '../src/auth/rolePermissions.js';

test('Step 19 SEO, Accessibility & Production Readiness Suite', async (t) => {
  let server;
  let baseUrl;

  // Spin up ephemeral test server
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

  // Ensure baseline users exist for test verification
  const scholarUser = await prisma.user.upsert({
    where: { email: 'step19_scholar@test.com' },
    update: { role: 'STUDENT', isActive: true },
    create: {
      email: 'step19_scholar@test.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLM',
      name: 'Step19 Scholar',
      role: 'STUDENT',
      isActive: true,
      isEmailVerified: true
    }
  });

  const moderatorUser = await prisma.user.upsert({
    where: { email: 'step19_moderator@test.com' },
    update: { role: 'MODERATOR', isActive: true },
    create: {
      email: 'step19_moderator@test.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLM',
      name: 'Step19 Moderator',
      role: 'MODERATOR',
      isActive: true,
      isEmailVerified: true
    }
  });

  const superAdminUser = await prisma.user.upsert({
    where: { email: 'step19_admin@test.com' },
    update: { role: 'SUPER_ADMIN', isActive: true },
    create: {
      email: 'step19_admin@test.com',
      passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLM',
      name: 'Step19 SuperAdmin',
      role: 'SUPER_ADMIN',
      isActive: true,
      isEmailVerified: true
    }
  });

  // Ensure an active subject and category exist
  const activeSubject = await prisma.subject.findFirst({ where: { isActive: true } });
  const activeCategory = await prisma.category.upsert({
    where: { slug: 'step19-seo-cat' },
    update: { isActive: true },
    create: {
      name: 'Step 19 SEO Category',
      slug: 'step19-seo-cat',
      isActive: true
    }
  });

  // Create an approved note and a draft note
  const approvedNote = await prisma.note.create({
    data: {
      title: 'Approved Production Note For Sitemap Test',
      slug: `approved-sitemap-${Date.now()}`,
      content: 'Production readiness content',
      storageKey: 'step19-approved.pdf',
      fileName: 'step19-approved.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      status: 'APPROVED',
      semester: 1,
      subjectId: activeSubject.id,
      courseId: activeSubject.courseId,
      categoryId: activeCategory.id,
      uploadedById: moderatorUser.id,
      publishedAt: new Date()
    }
  });

  const draftNote = await prisma.note.create({
    data: {
      title: 'Private Draft Note Excluded From Sitemap',
      slug: `draft-sitemap-${Date.now()}`,
      content: 'Draft content that must not be in sitemap',
      storageKey: 'step19-draft.pdf',
      fileName: 'step19-draft.pdf',
      fileSize: 2048,
      mimeType: 'application/pdf',
      status: 'DRAFT',
      semester: 1,
      subjectId: activeSubject.id,
      courseId: activeSubject.courseId,
      categoryId: activeCategory.id,
      uploadedById: moderatorUser.id
    }
  });

  const scholarToken = generateAccessToken(scholarUser);
  const moderatorToken = generateAccessToken(moderatorUser);
  const superAdminToken = generateAccessToken(superAdminUser);

  // 1. Health check probes
  await t.test('1. Production Health Probes: GET /health and GET /api/v1/health return 200 OK', async () => {
    const resRoot = await fetch(`${baseUrl}/health`);
    assert.equal(resRoot.status, 200);
    const bodyRoot = await resRoot.json();
    assert.equal(bodyRoot.success, true);
    assert.equal(bodyRoot.data?.status, 'healthy');

    const resV1 = await fetch(`${baseUrl}/api/v1/health`);
    assert.equal(resV1.status, 200);
    const bodyV1 = await resV1.json();
    assert.equal(bodyV1.success, true);
    assert.equal(bodyV1.data?.status, 'healthy');
  });

  // 2. Dynamic XML Sitemap generation
  await t.test('2. Dynamic XML Sitemap: GET /sitemap.xml returns valid XML with approved notes and excludes draft notes', async () => {
    const res = await fetch(`${baseUrl}/sitemap.xml`);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type')?.includes('application/xml'));

    const xmlText = await res.text();
    assert.ok(xmlText.includes('<?xml version="1.0" encoding="UTF-8"?>'));
    assert.ok(xmlText.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'));
    assert.ok(xmlText.includes('/notes/explore'));

    // Approved note must be included in sitemap
    assert.ok(xmlText.includes(`/notes/${approvedNote.id}`));

    // Draft note must be strictly excluded from sitemap
    assert.ok(!xmlText.includes(`/notes/${draftNote.id}`));
  });

  // 3. Robots.txt configuration
  await t.test('3. Robots Configuration: GET /robots.txt disallows private routes and references sitemap', async () => {
    const res = await fetch(`${baseUrl}/robots.txt`);
    assert.equal(res.status, 200);
    assert.ok(res.headers.get('content-type')?.includes('text/plain'));

    const robotsText = await res.text();
    assert.ok(robotsText.includes('User-agent: *'));
    assert.ok(robotsText.includes('Allow: /notes/explore'));
    assert.ok(robotsText.includes('Disallow: /admin'));
    assert.ok(robotsText.includes('Disallow: /dashboard'));
    assert.ok(robotsText.includes('Disallow: /profile'));
    assert.ok(robotsText.includes('Disallow: /api/'));
    assert.ok(robotsText.includes('Sitemap:'));
  });

  // 4. Production Security Headers
  await t.test('4. Enterprise Security Headers: Helmet & CSP configured on responses', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'DENY');
    assert.equal(res.headers.get('x-powered-by'), null); // Disabled
  });

  // 5. Critical Public Routes accessible without authentication
  await t.test('5. Critical Public Routes: Catalog discovery available anonymously', async () => {
    const resExplore = await fetch(`${baseUrl}/api/v1/notes/explore`);
    assert.equal(resExplore.status, 200);

    const resAcademics = await fetch(`${baseUrl}/api/v1/academics/overview`);
    assert.equal(resAcademics.status, 200);
  });

  // 6. Scholar Upload Restriction (RBAC Invariant)
  await t.test('6. RBAC Invariant: Scholar cannot upload notes (HTTP 403 Forbidden)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/notes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${scholarToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Exploit Attempt by Scholar',
        courseId: activeSubject.courseId,
        subjectId: activeSubject.id,
        semester: 1
      })
    });

    assert.equal(res.status, 403);
    const body = await res.json();
    assert.equal(body.error?.code, 'FORBIDDEN');
  });

  // 7. Scholar Download Permission for Approved Notes
  await t.test('7. RBAC Invariant: Scholar CAN download approved notes', async () => {
    const res = await fetch(`${baseUrl}/api/v1/notes/${approvedNote.id}/download`, {
      headers: { Authorization: `Bearer ${scholarToken}` }
    });

    // 200 (if file on disk) or 404 (file missing on disk) - but NOT 403 or 401
    assert.ok([200, 404].includes(res.status));
    assert.notEqual(res.status, 403);
    assert.notEqual(res.status, 401);
  });

  // 8. Protected Note File Access: Draft note download blocked
  await t.test('8. Protected File Access: Non-staff cannot download draft notes (HTTP 403)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/notes/${draftNote.id}/download`, {
      headers: { Authorization: `Bearer ${scholarToken}` }
    });

    assert.equal(res.status, 403);
  });

  // 9. Moderator Upload Permissions
  await t.test('9. Moderator Permissions: Moderator CAN upload notes (HTTP 201 Created)', async () => {
    const res = await fetch(`${baseUrl}/api/v1/notes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${moderatorToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Moderator Uploaded Readiness Note',
        courseId: activeSubject.courseId,
        subjectId: activeSubject.id,
        categoryId: activeCategory.id,
        semester: 1,
        content: 'Legitimate study content uploaded by verified moderator'
      })
    });

    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(body.success, true);

    // Clean up created note
    if (body.data?.id) {
      await prisma.note.delete({ where: { id: body.data.id } });
    }
  });

  // 10. Super Admin Control Center Access
  await t.test('10. Super Admin Controls: Super Admin can access administrative metrics', async () => {
    const res = await fetch(`${baseUrl}/api/v1/admin/overview`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });

    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(typeof body.data?.totalUsers === 'number');
    assert.ok(typeof body.data?.totalNotes === 'number');
  });

  // Clean up
  t.after(async () => {
    try {
      await prisma.note.deleteMany({
        where: { id: { in: [approvedNote.id, draftNote.id] } }
      });
      await prisma.user.deleteMany({
        where: { id: { in: [scholarUser.id, moderatorUser.id, superAdminUser.id] } }
      });
    } catch (_) {}
  });
});
