import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import prisma from '../src/config/database.js';
import { generateAccessToken } from '../src/services/tokens/token.service.js';
import { ROLES } from '../src/auth/rolePermissions.js';
import { DEFAULT_PAGE_CONFIGS } from '../src/modules/platformConfig/defaultConfigs.js';

test('Super Admin Platform Owner Control & Customization Suite', async (t) => {
  const app = createApp();
  let server;
  let baseUrl;

  let scholarToken = '';
  let adminToken = '';
  let superAdminToken = '';

  t.before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}/api/v1`;
        resolve();
      });
    });

    const superAdminUser = await prisma.user.findFirst({
      where: { role: ROLES.SUPER_ADMIN, isActive: true }
    });
    const adminUser = await prisma.user.findFirst({
      where: { role: ROLES.ADMIN, isActive: true }
    });
    const studentUser = await prisma.user.findFirst({
      where: { role: ROLES.STUDENT, isActive: true }
    });

    superAdminToken = generateAccessToken({
      id: superAdminUser.id,
      email: superAdminUser.email,
      role: superAdminUser.role
    });
    adminToken = generateAccessToken({
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role
    });
    scholarToken = generateAccessToken({
      id: studentUser.id,
      email: studentUser.email,
      role: studentUser.role
    });

    await prisma.pageConfiguration.upsert({
      where: { pageKey: 'scholar_dashboard' },
      update: {
        title: 'Scholar Dashboard',
        draftConfig: DEFAULT_PAGE_CONFIGS.scholar_dashboard,
        publishedConfig: DEFAULT_PAGE_CONFIGS.scholar_dashboard
      },
      create: {
        pageKey: 'scholar_dashboard',
        title: 'Scholar Dashboard',
        draftConfig: DEFAULT_PAGE_CONFIGS.scholar_dashboard,
        publishedConfig: DEFAULT_PAGE_CONFIGS.scholar_dashboard,
        version: 1
      }
    });
  });

  t.after(async () => {
    // Delete any test notes created by this suite so test artifacts never persist
    await prisma.note.deleteMany({
      where: { title: 'Platform Control Verified Note' }
    }).catch(() => {});
    if (server) await new Promise((resolve) => server.close(resolve));
    await prisma.$disconnect();
  });

  // 1. Public Configuration Delivery (Anonymous)
  await t.test('1. Public Configuration: GET /platform/config/public returns landing content anonymously', async () => {
    const res = await fetch(`${baseUrl}/platform/config/public`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(body.data.homepage);
    assert.ok(body.data.theme);
    assert.ok(body.data.features);
    assert.equal(body.data.homepage.hero.headline, 'Everything You Need to Study Smarter.');
  });

  // 2. Role-Scoped Workspace Configuration Delivery
  await t.test('2. Workspace Configuration: GET /platform/config/workspace returns role-scoped config', async () => {
    // Scholar
    const res1 = await fetch(`${baseUrl}/platform/config/workspace`, {
      headers: { Authorization: `Bearer ${scholarToken}` }
    });
    assert.equal(res1.status, 200);
    const body1 = await res1.json();
    assert.equal(body1.data.roleScope, 'SCHOLAR');
    assert.ok(body1.data.navigation);
    assert.ok(body1.data.pageConfig);

    // Admin
    const res2 = await fetch(`${baseUrl}/platform/config/workspace`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res2.status, 200);
    const body2 = await res2.json();
    assert.equal(body2.data.roleScope, 'ADMIN');
  });

  // 3. RBAC Guards: Scholar and Admin forbidden from Super Admin config endpoints
  await t.test('3. RBAC Guard: Scholar forbidden from administrative configuration (HTTP 403)', async () => {
    const res = await fetch(`${baseUrl}/admin/config/pages`, {
      headers: { Authorization: `Bearer ${scholarToken}` }
    });
    assert.equal(res.status, 403);
  });

  await t.test('4. RBAC Guard: Normal Admin forbidden from Super Admin UI builder (HTTP 403)', async () => {
    const res = await fetch(`${baseUrl}/admin/config/pages`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(res.status, 403);
  });

  // 5. Super Admin Page Config Draft vs Published Workflow
  await t.test('5. Super Admin: Update Scholar Dashboard draft and verify draft remains private', async () => {
    const patchRes = await fetch(`${baseUrl}/admin/config/pages/scholar_dashboard`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        draftConfig: {
          welcome_header: {
            title: 'Your Personal Study Hub',
            subtitle: 'Curated curriculum workspace for exams and revisions.',
            bannerAlert: { show: true, message: 'Mid-term revision papers are now accessible.' },
            isVisible: true
          },
          stats_kpi: {
            columns: 2,
            cards: [
              { id: 'saved', label: 'Saved Notes', show: true },
              { id: 'downloads', label: 'Total Downloads', show: true }
            ],
            isVisible: true
          },
          activity_chart: {
            chartTitle: 'Weekly Learning Momentum',
            defaultRange: '7d',
            chartType: 'line',
            isVisible: true
          },
          workspace_sections: {
            columns: 2,
            sections: [
              { id: 'recent_notes', title: 'Recently Viewed & Saved', show: true, order: 1 }
            ],
            isVisible: true
          }
        }
      })
    });
    assert.equal(patchRes.status, 200);

    // Verify scholar still receives published configuration (not draft)
    const scholarRes = await fetch(`${baseUrl}/platform/config/workspace`, {
      headers: { Authorization: `Bearer ${scholarToken}` }
    });
    const scholarBody = await scholarRes.json();
    assert.equal(scholarBody.data.pageConfig.welcome_header.title, 'Welcome back, Scholar');
  });

  // 6. Super Admin: Publish Scholar Dashboard and verify live delivery
  await t.test('6. Super Admin: Publish Scholar Dashboard and verify immediate delivery to Scholars', async () => {
    const pubRes = await fetch(`${baseUrl}/admin/config/pages/scholar_dashboard/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ changeSummary: 'Updated title to Personal Study Hub and 2-col KPI' })
    });
    assert.equal(pubRes.status, 200);
    const pubBody = await pubRes.json();
    assert.equal(pubBody.data.publishedConfig.welcome_header.title, 'Your Personal Study Hub');

    // Scholar now receives the updated published config!
    const scholarRes = await fetch(`${baseUrl}/platform/config/workspace`, {
      headers: { Authorization: `Bearer ${scholarToken}` }
    });
    const scholarBody = await scholarRes.json();
    assert.equal(scholarBody.data.pageConfig.welcome_header.title, 'Your Personal Study Hub');
    assert.equal(scholarBody.data.pageConfig.stats_kpi.columns, 2);
  });

  // 7. Security: Reject XSS / Malicious script injection in Page Config
  await t.test('7. Security Invariant: Reject malicious script injection in page builder (HTTP 422)', async () => {
    const badRes = await fetch(`${baseUrl}/admin/config/pages/homepage`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        draftConfig: {
          hero: {
            headline: '<script>alert("xss")</script>',
            isVisible: true
          }
        }
      })
    });
    assert.equal(badRes.status, 422);
    const badBody = await badRes.json();
    assert.match(badBody.error.message, /prohibited executable or script content/i);
  });

  // 8. Theme Studio: Super Admin updates and publishes theme
  await t.test('8. Theme Studio: Super Admin updates and publishes theme with valid color tokens', async () => {
    const themePatch = await fetch(`${baseUrl}/admin/config/themes/SCHOLAR`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        draftConfig: {
          primaryColor: '#0f766e',
          secondaryColor: '#115e59',
          accentColor: '#d97706',
          backgroundColor: '#f8fafc',
          surfaceColor: '#ffffff',
          textPrimary: '#0f172a',
          textSecondary: '#475569',
          borderRadius: '12px',
          fontPreset: 'jakarta-inter',
          logoText: 'PJ Study KRMU',
          logoBadge: 'SCHOLAR DESK'
        }
      })
    });
    assert.equal(themePatch.status, 200);

    const themePub = await fetch(`${baseUrl}/admin/config/themes/SCHOLAR/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ changeSummary: 'Updated primary color to Teal' })
    });
    assert.equal(themePub.status, 200);

    // Verify scholar receives new theme tokens
    const scholarRes = await fetch(`${baseUrl}/platform/config/workspace`, {
      headers: { Authorization: `Bearer ${scholarToken}` }
    });
    const scholarBody = await scholarRes.json();
    assert.equal(scholarBody.data.theme.primaryColor, '#0f766e');
    assert.equal(scholarBody.data.theme.borderRadius, '12px');
  });

  // 9. Feature Control: Toggle optional feature
  await t.test('9. Feature Control: Toggle feature flag and verify in workspace delivery', async () => {
    const toggleRes = await fetch(`${baseUrl}/admin/config/features/recommendations`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ isEnabled: false })
    });
    assert.equal(toggleRes.status, 200);

    const checkRes = await fetch(`${baseUrl}/platform/config/public`);
    const checkBody = await checkRes.json();
    assert.equal(checkBody.data.features.recommendations, false);

    // Re-enable
    await fetch(`${baseUrl}/admin/config/features/recommendations`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ isEnabled: true })
    });
  });

  // 10. Admin Permissions Scoping: Super Admin scopes permissions securely
  await t.test('10. Admin Permissions: Super Admin scopes permissions and prevents privilege escalation', async () => {
    // Normal scoping succeeds
    const okRes = await fetch(`${baseUrl}/admin/config/permissions`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        scopes: [
          { id: 'notes:create', label: 'Upload Study Notes', isGranted: true },
          { id: 'notes:review', label: 'Direct Publishing', isGranted: true }
        ]
      })
    });
    assert.equal(okRes.status, 200);

    // Attempting to grant Super Admin permission (e.g. settings:manage) fails with 403
    const badRes = await fetch(`${baseUrl}/admin/config/permissions`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        scopes: [
          { id: 'settings:manage', label: 'Platform Settings', isGranted: true }
        ]
      })
    });
    assert.equal(badRes.status, 403);
  });

  // 11. Version History and Rollback
  await t.test('11. Rollback Mechanism: Restore previous page configuration snapshot', async () => {
    const histRes = await fetch(`${baseUrl}/admin/config/history`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(histRes.status, 200);
    const histBody = await histRes.json();
    assert.ok(Array.isArray(histBody.data));
    assert.ok(histBody.data.length > 0);

    const firstSnapshot = histBody.data[0];

    const rollbackRes = await fetch(`${baseUrl}/admin/config/restore/${firstSnapshot.id}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(rollbackRes.status, 200);
    const rollbackBody = await rollbackRes.json();
    assert.equal(rollbackBody.success, true);
  });

  // 12. Notes Invariants Preserved: Scholar cannot upload notes, Admin can upload and publishes immediately
  await t.test('12. Notes Invariants: Scholar forbidden from uploading notes (HTTP 403)', async () => {
    const res = await fetch(`${baseUrl}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${scholarToken}`
      },
      body: JSON.stringify({
        title: 'Scholar Attempted Note',
        courseId: 'any',
        subjectId: 'any'
      })
    });
    assert.equal(res.status, 403);
  });

  await t.test('13. Notes Invariants: Admin uploads note and it publishes immediately', async () => {
    // Get valid course and subject with fallback
    const courseRes = await fetch(`${baseUrl}/courses`);
    const courses = (await courseRes.json()).data || [];
    let targetCourse = courses[0];
    let targetSubject = null;

    for (const c of courses) {
      const subjRes = await fetch(`${baseUrl}/subjects?courseId=${c.id}`);
      const subjects = (await subjRes.json()).data || [];
      if (subjects.length > 0) {
        targetCourse = c;
        targetSubject = subjects[0];
        break;
      }
    }

    const catRes = await fetch(`${baseUrl}/categories`);
    const categories = (await catRes.json()).data || [];
    const targetCategory = categories.find((cat) => cat.isActive) || categories[0];

    const uploadRes = await fetch(`${baseUrl}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: 'Platform Control Verified Note',
        description: 'Testing direct publishing under platform control suite',
        courseId: targetCourse.id,
        subjectId: targetSubject.id,
        categoryId: targetCategory.id,
        semester: targetSubject.semester || 1,
        content: 'Comprehensive verified lecture notes.'
      })
    });
    assert.equal(uploadRes.status, 201);
    const uploadBody = await uploadRes.json();
    assert.equal(uploadBody.data.status, 'PUBLISHED');

    // Clean up created note immediately to keep dev database pristine
    if (uploadBody.data?.id) {
      await prisma.note.delete({ where: { id: uploadBody.data.id } }).catch(() => {});
    }
  });
});
