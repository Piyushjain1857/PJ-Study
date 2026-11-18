import test from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import prisma from '../src/config/database.js';
import storageService from '../src/services/storage/storage.service.js';
import { generateAccessToken } from '../src/services/tokens/token.service.js';

test('PJ Study — Prompt 29 Final Quality Assurance, E2E Workflows & Acceptance Suite', async (t) => {
  let server;
  let baseUrl;
  let hostUrl;
  let scholarToken;
  let adminToken;
  let superAdminToken;

  t.before(async () => {
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const { port } = server.address();
        hostUrl = `http://127.0.0.1:${port}`;
        baseUrl = `${hostUrl}/api/v1`;
        resolve();
      });
    });

    const authenticStudent = await prisma.user.findFirst({ where: { role: 'STUDENT', isActive: true } });
    const authenticAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN', isActive: true } });
    const authenticSuperAdmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', isActive: true } });

    scholarToken = generateAccessToken(authenticStudent || { id: 'std', email: 'student@portal.com', role: 'STUDENT' });
    adminToken = generateAccessToken(authenticAdmin || { id: 'adm', email: 'admin@portal.com', role: 'ADMIN' });
    superAdminToken = generateAccessToken(authenticSuperAdmin || { id: 'sadm', email: 'superadmin@portal.com', role: 'SUPER_ADMIN' });
  });

  t.after(async () => {
    if (server) server.close();
  });

  // Find existing taxonomy for notes
  const subject = await prisma.subject.findFirst({ select: { id: true, courseId: true } });
  const category = await prisma.category.findFirst({ select: { id: true } });
  let existingPublishedNote = await prisma.note.findFirst({
    where: { status: { in: ['APPROVED', 'PUBLISHED'] } },
    select: { id: true, title: true, fileName: true }
  });

  let createdQaBaselineNoteId = null;
  if (!existingPublishedNote) {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (subject && admin) {
      const samplePdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');
      const stored = await storageService.local.saveFile(
        {
          originalname: 'operating-systems-notes.pdf',
          buffer: samplePdfBuffer,
          size: samplePdfBuffer.length,
          mimetype: 'application/pdf'
        },
        '.pdf',
        'application/pdf'
      );
      existingPublishedNote = await prisma.note.create({
        data: {
          title: 'Advanced Operating Systems Notes',
          content: 'Process synchronization and virtual memory management notes.',
          status: 'PUBLISHED',
          courseId: subject.courseId,
          subjectId: subject.id,
          categoryId: category?.id,
          uploadedById: admin.id,
          fileName: stored.fileName,
          mimeType: stored.mimeType,
          fileSize: stored.fileSize,
          storageKey: stored.storageKey,
          storageProvider: 'local'
        },
        select: { id: true, title: true, fileName: true }
      });
      createdQaBaselineNoteId = existingPublishedNote.id;
    }
  }

  // Capture baseline counts for critical invariant AFTER ensuring baseline note exists
  const initialUserCount = await prisma.user.count();
  const initialNoteCount = await prisma.note.count();

  assert.ok(subject, 'Valid subject required for testing');
  assert.ok(category, 'Valid category required for testing');
  assert.ok(existingPublishedNote, 'At least one published note required for testing');

  // ---------------------------------------------------------------------------
  // 1. PUBLIC WEBSITE & DISCOVERY ENDPOINTS
  // ---------------------------------------------------------------------------
  await t.test('1. Public Website: SEO, discovery, and catalog routes return healthy responses', async () => {
    const [healthRes, configRes, sitemapRes, robotsRes, exploreRes, coursesRes] = await Promise.all([
      fetch(`${baseUrl}/health`),
      fetch(`${baseUrl}/config`),
      fetch(`${hostUrl}/sitemap.xml`),
      fetch(`${hostUrl}/robots.txt`),
      fetch(`${baseUrl}/notes/explore`),
      fetch(`${baseUrl}/courses`)
    ]);

    assert.strictEqual(healthRes.status, 200);
    assert.strictEqual(configRes.status, 200);
    assert.strictEqual(sitemapRes.status, 200);
    assert.strictEqual(robotsRes.status, 200);
    assert.strictEqual(exploreRes.status, 200);
    assert.strictEqual(coursesRes.status, 200);

    const sitemapText = await sitemapRes.text();
    assert.ok(sitemapText.includes('<urlset'), 'Sitemap must be valid XML urlset');

    const robotsText = await robotsRes.text();
    assert.ok(robotsText.includes('Disallow: /dashboard'), 'Robots must protect private dashboards');
  });

  // ---------------------------------------------------------------------------
  // 2. JOURNEY A: SCHOLAR COMPREHENSIVE END-TO-END WORKFLOW
  // ---------------------------------------------------------------------------
  await t.test('2. Journey A (Scholar): Registration -> Login -> Dashboard -> Search -> Preview -> Download -> Bookmark -> Collection -> Logout', async () => {
    const scholarEmail = `qa_scholar_${Date.now()}@pjstudy.com`;
    const scholarPass = 'ScholarPass123!';
    let scholarId = null;
    let token = null;

    try {
      // 2.1 Registration
      const regRes = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'QA Test Scholar',
          email: scholarEmail,
          password: scholarPass
        })
      });
      assert.strictEqual(regRes.status, 201);
      const regData = await regRes.json();
      scholarId = regData.data.id;
      assert.strictEqual(regData.data.role, 'STUDENT', 'Public registration must assign STUDENT role');

      // 2.2 Login
      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: scholarEmail,
          password: scholarPass
        })
      });
      assert.strictEqual(loginRes.status, 200);
      const loginData = await loginRes.json();
      token = loginData.data.accessToken;
      assert.ok(token, 'Access token must be returned on login');

      // 2.3 Identity Check (/auth/me)
      const meRes = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(meRes.status, 200);
      const meData = await meRes.json();
      assert.strictEqual(meData.data.id, scholarId);
      assert.strictEqual(meData.data.role, 'STUDENT');

      // 2.4 Scholar Dashboard (/dashboard/overview)
      const dashRes = await fetch(`${baseUrl}/dashboard/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(dashRes.status, 200);
      const dashData = await dashRes.json();
      assert.ok(dashData.data.stats !== undefined);
      assert.strictEqual(dashData.data.stats.savedNotes, 0);

      // 2.5 Catalog Search
      const searchRes = await fetch(`${baseUrl}/notes/explore?search=${encodeURIComponent(existingPublishedNote.title)}`);
      assert.strictEqual(searchRes.status, 200);
      const searchData = await searchRes.json();
      assert.ok(searchData.data.notes.length > 0);

      // 2.6 Document Preview (PDF or Image)
      const previewRes = await fetch(`${baseUrl}/notes/${existingPublishedNote.id}/preview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(previewRes.status, 200);
      assert.ok(
        ['application/pdf', 'image/png', 'image/jpeg'].includes(previewRes.headers.get('content-type')),
        `Expected preview content-type to be valid document format, got ${previewRes.headers.get('content-type')}`
      );
      assert.ok(previewRes.headers.get('content-disposition')?.includes('inline'));

      // 2.7 Document Download
      const downloadRes = await fetch(`${baseUrl}/notes/${existingPublishedNote.id}/download`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(downloadRes.status, 200);
      assert.ok(downloadRes.headers.get('content-disposition')?.includes('attachment'));

      // 2.8 Bookmark Note
      const bmRes = await fetch(`${baseUrl}/notes/${existingPublishedNote.id}/bookmark`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(bmRes.status, 200);

      const bmsRes = await fetch(`${baseUrl}/notes/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(bmsRes.status, 200);
      const bmsData = await bmsRes.json();
      const bookmarkItems = bmsData.data.items || bmsData.data || [];
      const hasBm = bookmarkItems.some((n) => n.id === existingPublishedNote.id);
      assert.ok(hasBm, 'Bookmarked note must appear in scholar bookmarks list');

      // 2.9 Study Collection Lifecycle
      const colRes = await fetch(`${baseUrl}/collections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: 'E2E Exam Prep Binder',
          description: 'Synthetic collection created for QA testing'
        })
      });
      assert.strictEqual(colRes.status, 201);
      const colData = await colRes.json();
      const collectionId = colData.data.id;

      // Add note to collection
      const addNoteRes = await fetch(`${baseUrl}/collections/${collectionId}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ noteId: existingPublishedNote.id })
      });
      assert.strictEqual(addNoteRes.status, 200);

      // Get collection details
      const getColRes = await fetch(`${baseUrl}/collections/${collectionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(getColRes.status, 200);
      const getColData = await getColRes.json();
      assert.strictEqual(getColData.data.itemCount, 1);
      assert.strictEqual(getColData.data.notes[0].id, existingPublishedNote.id);

      // Remove note from collection
      const rmNoteRes = await fetch(`${baseUrl}/collections/${collectionId}/notes/${existingPublishedNote.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(rmNoteRes.status, 200);

      // Delete collection
      const delColRes = await fetch(`${baseUrl}/collections/${collectionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(delColRes.status, 200);

      // Remove bookmark
      const rmBmRes = await fetch(`${baseUrl}/notes/${existingPublishedNote.id}/bookmark`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(rmBmRes.status, 200);

      // 2.10 Logout
      const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      assert.strictEqual(logoutRes.status, 200);
    } finally {
      if (scholarId) {
        await prisma.studyCollectionItem.deleteMany({ where: { collection: { userId: scholarId } } }).catch(() => {});
        await prisma.studyCollection.deleteMany({ where: { userId: scholarId } }).catch(() => {});
        await prisma.bookmark.deleteMany({ where: { userId: scholarId } }).catch(() => {});
        await prisma.emailVerificationToken.deleteMany({ where: { userId: scholarId } }).catch(() => {});
        await prisma.downloadHistory.deleteMany({ where: { userId: scholarId } }).catch(() => {});
        await prisma.user.deleteMany({ where: { id: scholarId } }).catch(() => {});
      }
    }
  });

  // ---------------------------------------------------------------------------
  // 3. JOURNEY B: ADMIN DIRECT PUBLISHING & WORKSPACE
  // ---------------------------------------------------------------------------
  await t.test('3. Journey B (Admin): Sign in -> Workspace -> Upload Note -> Direct Publish -> Edit -> Public Visibility -> Cleanup', async () => {
    // 3.1 Load Admin Workspace
    const wsRes = await fetch(`${baseUrl}/admin-workspace/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(wsRes.status, 200);
    const wsData = await wsRes.json();
    assert.ok(wsData.data.publishedNotes !== undefined);

    // 3.2 Upload note with immediate publication
    const noteTitle = `E2E Acceptance Admin Note ${Date.now()}`;
    const uploadRes = await fetch(`${baseUrl}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        title: noteTitle,
        description: 'Comprehensive test manuscript for Prompt 29 QA',
        content: 'Verified body text for acceptance testing.',
        subjectId: subject.id,
        categoryId: category.id,
        semester: 1
      })
    });
    assert.strictEqual(uploadRes.status, 201);
    const uploadData = await uploadRes.json();
    const createdNoteId = uploadData.data.id;
    assert.strictEqual(uploadData.data.status, 'PUBLISHED', 'Admin note uploads must publish directly and immediately');

    // 3.3 Edit note metadata
    const editRes = await fetch(`${baseUrl}/notes/${createdNoteId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        description: 'Updated metadata description after review.'
      })
    });
    assert.strictEqual(editRes.status, 200);
    const editData = await editRes.json();
    assert.strictEqual(editData.data.description, 'Updated metadata description after review.');

    // 3.4 Public Explorer Visibility
    const pubRes = await fetch(`${baseUrl}/notes/explore?search=${encodeURIComponent(noteTitle)}`);
    assert.strictEqual(pubRes.status, 200);
    const pubData = await pubRes.json();
    const found = pubData.data.notes.some((n) => n.id === createdNoteId);
    assert.ok(found, 'Directly published admin note must be immediately visible in public explore');

    // 3.5 Cleanup: Delete note
    const delRes = await fetch(`${baseUrl}/notes/${createdNoteId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(delRes.status, 200);
  });

  // ---------------------------------------------------------------------------
  // 4. JOURNEY C: SUPER ADMIN CONTROL CENTER & VISUAL BUILDER
  // ---------------------------------------------------------------------------
  await t.test('4. Journey C (Super Admin): Command Center -> User Management -> Academic Hierarchy -> Visual Builder Draft -> Cleanup', async () => {
    // 4.1 Command Center Overview
    const saRes = await fetch(`${baseUrl}/admin/overview`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(saRes.status, 200);
    const saData = await saRes.json();
    assert.ok(saData.data.totalUsers >= 3);

    // 4.2 User Management List
    const usersRes = await fetch(`${baseUrl}/admin/users?limit=10`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(usersRes.status, 200);

    // 4.3 Academic Taxonomy: Create course with dynamic semesters
    const courseCode = `CS_${Date.now().toString().slice(-6)}`;
    const courseRes = await fetch(`${baseUrl}/academics/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        name: `QA Course ${courseCode}`,
        code: courseCode,
        semestersCount: 6,
        description: 'Dynamic academic hierarchy test course'
      })
    });
    assert.strictEqual(courseRes.status, 201);
    const courseData = await courseRes.json();
    const createdCourseId = courseData.data.id;

    // Verify dynamic semesters
    const semRes = await fetch(`${baseUrl}/academics/courses/${createdCourseId}/semesters`);
    assert.strictEqual(semRes.status, 200);
    const semData = await semRes.json();
    assert.deepStrictEqual(semData.data.semesters, [1, 2, 3, 4, 5, 6]);

    // 4.4 Platform Settings
    const settingsRes = await fetch(`${baseUrl}/admin/settings`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(settingsRes.status, 200);

    // 4.5 Visual Website Builder Draft
    const builderRes = await fetch(`${baseUrl}/admin/config/pages/homepage`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(builderRes.status, 200);

    // Cleanup: Delete test course
    const delCourseRes = await fetch(`${baseUrl}/academics/courses/${createdCourseId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.strictEqual(delCourseRes.status, 200);
  });

  // ---------------------------------------------------------------------------
  // 5. JOURNEY D: UNAUTHORIZED USER & PRIVILEGE BOUNDARY ENFORCEMENT
  // ---------------------------------------------------------------------------
  await t.test('5. Journey D (Unauthorized): Enforces strict 401/403 boundaries and blocks privilege escalation', async () => {
    // 5.1 Anonymous user cannot upload notes (401)
    const unauthUpload = await fetch(`${baseUrl}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Unauth Note' })
    });
    assert.strictEqual(unauthUpload.status, 401);

    // 5.2 Scholar cannot upload notes (403 UPLOAD_FORBIDDEN)
    const scholarUpload = await fetch(`${baseUrl}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${scholarToken}`
      },
      body: JSON.stringify({
        title: 'Scholar Attempting Upload',
        subjectId: subject.id
      })
    });
    assert.strictEqual(scholarUpload.status, 403);

    // 5.3 Scholar cannot access Super Admin Overview (403)
    const scholarAdmin = await fetch(`${baseUrl}/admin/overview`, {
      headers: { Authorization: `Bearer ${scholarToken}` }
    });
    assert.strictEqual(scholarAdmin.status, 403);

    // 5.4 Scholar cannot escalate role via profile update (403)
    const scholarEscalate = await fetch(`${baseUrl}/profile/me`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${scholarToken}`
      },
      body: JSON.stringify({ role: 'SUPER_ADMIN' })
    });
    assert.strictEqual(scholarEscalate.status, 403);

    // 5.5 Admin cannot access Super Admin Overview (403)
    const adminSuper = await fetch(`${baseUrl}/admin/overview`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(adminSuper.status, 403);

    // 5.6 Admin cannot update system settings (403)
    const adminSettings = await fetch(`${baseUrl}/admin/settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ allowRegistration: false })
    });
    assert.strictEqual(adminSettings.status, 403);
  });

  // ---------------------------------------------------------------------------
  // 6. CRITICAL DATABASE INVARIANT CHECK
  // ---------------------------------------------------------------------------
  await t.test('6. Invariant Verification: Permanent records remain intact with zero residue or unintended mutations', async () => {
    const finalUserCount = await prisma.user.count();
    const finalNoteCount = await prisma.note.count();

    assert.strictEqual(finalUserCount, initialUserCount, 'User count must remain identical before and after test suite');
    assert.strictEqual(finalNoteCount, initialNoteCount, 'Note count must remain identical before and after test suite');
  });
});
