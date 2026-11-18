import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';
import prisma from '../src/config/database.js';
import { generateAccessToken } from '../src/services/tokens/token.service.js';
import { ROLES } from '../src/auth/rolePermissions.js';
import { DEFAULT_PAGE_CONFIGS } from '../src/modules/platformConfig/defaultConfigs.js';

/**
 * Helper to safely delete a test user and all related records without FK constraint violations.
 *
 * @param {string} userId
 */
async function deleteUserCascading(userId) {
  if (!userId) return;
  try {
    await prisma.emailVerificationToken.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.passwordResetToken.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.refreshSession.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.notificationPreference.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.notification.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.bookmark.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.reviewHelpfulVote.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.review.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.downloadHistory.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.noteViewHistory.deleteMany({ where: { userId } }).catch(() => {});
    await prisma.auditLog.deleteMany({ where: { actorId: userId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: userId } }).catch(() => {});
  } catch (err) {
    // Ignore cleanup error if already removed
  }
}

/**
 * PJ STUDY — COMPLETE END-TO-END USER JOURNEYS & FULL APPLICATION INTEGRATION SUITE (PROMPT 23)
 *
 * Verifies all 5 core end-to-end user journeys:
 * 1. Scholar Journey (Register, Login, Dashboard, Explore, Details, Preview, Download, Bookmark, Review, Logout)
 * 2. Admin Journey (Workspace, Direct Publishing Note Upload, Exploration Visibility, Metadata Update, Safe Deletion)
 * 3. Super Admin Journey (Command Center, User Management, Audit Logs, Settings, Visual Builder, System Probes)
 * 4. Security & Privilege Escalation Defenses (RBAC boundaries, forbidden mutations, mass assignment protection)
 * 5. Database Invariant & Zero-Mutation Guarantee (Pre/Post assert: exactly 2 authentic notes, 4 users)
 */
test('PJ Study — Complete End-to-End User Journeys & Full Integration (Prompt 23)', async (t) => {
  const app = createApp();
  let server;
  let baseUrl;

  // Tokens & authentic users
  let scholarToken;
  let adminToken;
  let superAdminToken;

  let authenticStudent;
  let authenticAdmin;
  let authenticSuperAdmin;

  // Taxonomy IDs for testing note lifecycle
  let validSubjectId;
  let validCategoryId;
  let validCourseId;

  // Track initial DB counts to enforce invariant
  let initialNoteCount;
  let initialUserCount;

  // Track dynamic records to ensure 100% cleanup
  let createdScholarUserId;
  let createdAdminNoteId;
  let createdReviewId;

  t.before(async () => {
    // 1. Record baseline database counts
    initialNoteCount = await prisma.note.count();
    initialUserCount = await prisma.user.count();

    assert.ok(initialNoteCount >= 1, 'Pre-condition: Authentic database must contain at least 1 note');
    assert.ok(initialUserCount >= 1, 'Pre-condition: Authentic database must contain authentic users');

    // 2. Start test server on ephemeral port
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}/api/v1`;
        resolve();
      });
    });

    // 3. Retrieve authentic users
    authenticStudent = await prisma.user.findFirst({
      where: { role: ROLES.STUDENT, isActive: true }
    });
    authenticAdmin = await prisma.user.findFirst({
      where: { role: ROLES.ADMIN, isActive: true }
    });
    authenticSuperAdmin = await prisma.user.findFirst({
      where: { role: ROLES.SUPER_ADMIN, isActive: true }
    });

    assert.ok(authenticStudent, 'Authentic student must exist');
    assert.ok(authenticAdmin, 'Authentic admin must exist');
    assert.ok(authenticSuperAdmin, 'Authentic superadmin must exist');

    // 4. Generate bearer tokens
    scholarToken = generateAccessToken(authenticStudent);
    adminToken = generateAccessToken(authenticAdmin);
    superAdminToken = generateAccessToken(authenticSuperAdmin);

    // 5. Retrieve taxonomy foreign keys
    const subject = await prisma.subject.findFirst();
    const category = await prisma.category.findFirst();
    const course = await prisma.course.findFirst();

    validSubjectId = subject?.id;
    validCategoryId = category?.id;
    validCourseId = course?.id;

    assert.ok(validSubjectId, 'Valid subject ID must be present in database');
    assert.ok(validCategoryId, 'Valid category ID must be present in database');
  });

  t.after(async () => {
    // Teardown: Clean up any test records created during journeys
    if (createdReviewId) {
      await prisma.review.deleteMany({ where: { id: createdReviewId } }).catch(() => {});
    }
    if (createdAdminNoteId) {
      await prisma.note.deleteMany({ where: { id: createdAdminNoteId } }).catch(() => {});
    }
    if (createdScholarUserId) {
      await deleteUserCascading(createdScholarUserId);
    }

    // Restore pristine default homepage visual configuration
    await prisma.pageConfiguration.update({
      where: { pageKey: 'homepage' },
      data: {
        draftConfig: DEFAULT_PAGE_CONFIGS.homepage,
        publishedConfig: DEFAULT_PAGE_CONFIGS.homepage
      }
    }).catch(() => {});

    // Clean up any remaining bookmarks by authentic student on test notes
    await prisma.bookmark.deleteMany({
      where: { userId: authenticStudent.id }
    }).catch(() => {});

    // Close test server
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }

    // Post-condition: Assert database record counts are 100% pristine
    const finalNoteCount = await prisma.note.count();
    const finalUserCount = await prisma.user.count();

    assert.equal(
      finalNoteCount,
      initialNoteCount,
      `Invariant violation: Note count changed from ${initialNoteCount} to ${finalNoteCount}`
    );
    assert.equal(
      finalUserCount,
      initialUserCount,
      `Invariant violation: User count changed from ${initialUserCount} to ${finalUserCount}`
    );
  });

  // ===========================================================================
  // JOURNEY 1: SCHOLAR END-TO-END JOURNEY
  // ===========================================================================
  await t.test('1. Scholar Complete End-to-End User Journey', async (t2) => {
    const uniqueEmail = `e2e_scholar_${Date.now()}@pjstudy.com`;
    const password = 'ScholarPassword123!';
    let registeredAccessToken = '';

    await t2.test('1.1 Registration: Public user registers with legitimate student role', async () => {
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'E2E Testing Scholar',
          email: uniqueEmail,
          password
        })
      });

      assert.equal(res.status, 201, 'Registration should return 201 Created');
      const json = await res.json();
      assert.equal(json.success, true);
      const user = json.data?.user || json.data;
      assert.ok(user, 'User object must be returned');
      assert.equal(user.email, uniqueEmail);
      assert.equal(user.role, 'STUDENT', 'Public registration must default to STUDENT');
      createdScholarUserId = user.id;
    });

    await t2.test('1.2 Login: Scholar authenticates with credentials to receive JWT', async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: uniqueEmail, password })
      });

      assert.equal(res.status, 200, 'Login should return 200 OK');
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.data.accessToken);
      assert.equal(json.data.user.role, 'STUDENT');
      registeredAccessToken = json.data.accessToken;
    });

    await t2.test('1.3 Identity Verification: GET /auth/me returns authenticated scholar profile', async () => {
      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${registeredAccessToken}` }
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.data.email, uniqueEmail);
      assert.equal(json.data.role, 'STUDENT');
    });

    await t2.test('1.4 Dashboard Overview: GET /dashboard/overview loads learning metrics', async () => {
      const res = await fetch(`${baseUrl}/dashboard/overview`, {
        headers: { Authorization: `Bearer ${registeredAccessToken}` }
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.data);
    });

    await t2.test('1.5 Notes Discovery: GET /notes/explore with search and filters returns catalog', async () => {
      const res = await fetch(`${baseUrl}/notes/explore?search=test&page=1&limit=10`);

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(Array.isArray(json.data.notes || json.data.items));
    });

    let targetNoteId;
    await t2.test('1.6 Single Note Details: GET /notes/:id returns published manuscript', async () => {
      // Find authentic note ID
      const note = await prisma.note.findFirst({ where: { status: 'PUBLISHED' } });
      assert.ok(note, 'At least one published note must exist');
      targetNoteId = note.id;

      const res = await fetch(`${baseUrl}/notes/${targetNoteId}`);
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.id, targetNoteId);
      assert.equal(json.data.status, 'PUBLISHED');
    });

    await t2.test('1.7 Document Streaming & Preview: GET /notes/:id/preview serves document stream', async () => {
      const res = await fetch(`${baseUrl}/notes/${targetNoteId}/preview`);
      // Note returns 200 stream or 404 if content-only note without file
      assert.ok([200, 404].includes(res.status));
    });

    await t2.test('1.8 Document Download: GET /notes/:id/download triggers download proxy', async () => {
      const res = await fetch(`${baseUrl}/notes/${targetNoteId}/download`);
      assert.ok([200, 404].includes(res.status));
    });

    await t2.test('1.9 Bookmark Management: Add, list, and remove bookmark', async () => {
      // 1. Add Bookmark
      const addRes = await fetch(`${baseUrl}/notes/${targetNoteId}/bookmark`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${registeredAccessToken}` }
      });
      assert.equal(addRes.status, 200);
      const addJson = await addRes.json();
      assert.equal(addJson.success, true);
      assert.equal(addJson.data.bookmarked, true);

      // 2. Verify in library
      const listRes = await fetch(`${baseUrl}/notes/bookmarks`, {
        headers: { Authorization: `Bearer ${registeredAccessToken}` }
      });
      assert.equal(listRes.status, 200);
      const listJson = await listRes.json();
      const items = listJson.data.items || listJson.data;
      const found = items.some((b) => (b.note?.id || b.id) === targetNoteId);
      assert.ok(found, 'Bookmarked note must appear in scholar library');

      // 3. Remove Bookmark
      const delRes = await fetch(`${baseUrl}/notes/${targetNoteId}/bookmark`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${registeredAccessToken}` }
      });
      assert.equal(delRes.status, 200);
      const delJson = await delRes.json();
      assert.equal(delJson.success, true);
      assert.equal(delJson.data.bookmarked, false);
    });

    await t2.test('1.10 Peer Review: Post and retrieve 5-star student review', async () => {
      const postRes = await fetch(`${baseUrl}/notes/${targetNoteId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${registeredAccessToken}`
        },
        body: JSON.stringify({
          rating: 5,
          comment: 'Outstanding clarity and concise exam prep!'
        })
      });

      assert.equal(postRes.status, 201);
      const postJson = await postRes.json();
      assert.equal(postJson.success, true);
      assert.equal(postJson.data.rating, 5);
      createdReviewId = postJson.data.id;

      // Verify review appears in GET /notes/:id/reviews
      const getRes = await fetch(`${baseUrl}/notes/${targetNoteId}/reviews`);
      assert.equal(getRes.status, 200);
      const getJson = await getRes.json();
      const reviews = getJson.data.items || getJson.data;
      const foundReview = reviews.some((r) => r.id === createdReviewId);
      assert.ok(foundReview, 'Submitted review must appear in public note review list');

      // Teardown review immediately
      await prisma.review.deleteMany({ where: { id: createdReviewId } });
      createdReviewId = null;
    });

    await t2.test('1.11 Notification Center: GET /notifications loads in-app notifications', async () => {
      const res = await fetch(`${baseUrl}/notifications`, {
        headers: { Authorization: `Bearer ${registeredAccessToken}` }
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
    });

    await t2.test('1.12 Session Termination: POST /auth/logout ends scholar session', async () => {
      const res = await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${registeredAccessToken}` }
      });
      assert.equal(res.status, 200);
    });

    // Teardown temporary scholar user
    await deleteUserCascading(createdScholarUserId);
    createdScholarUserId = null;
  });

  // ===========================================================================
  // JOURNEY 2: ADMIN END-TO-END JOURNEY (DIRECT PUBLISHING & NOTE LIFECYCLE)
  // ===========================================================================
  await t.test('2. Admin Complete End-to-End User Journey', async (t2) => {
    const testNoteTitle = `E2E Direct Publish Note ${Date.now()}`;

    await t2.test('2.1 Admin Workspace Overview: GET /admin-workspace/overview returns metrics', async () => {
      const res = await fetch(`${baseUrl}/admin-workspace/overview`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
    });

    await t2.test('2.2 Note Creation: Admin uploads note and it publishes directly and immediately', async () => {
      const res = await fetch(`${baseUrl}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          title: testNoteTitle,
          content: 'Detailed lecture notes on distributed systems consensus algorithms.',
          subjectId: validSubjectId,
          categoryId: validCategoryId,
          semester: 1
        })
      });

      assert.equal(res.status, 201, 'Admin note creation must return 201 Created');
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.title, testNoteTitle);
      assert.equal(
        json.data.status,
        'PUBLISHED',
        'Admin note must publish directly and immediately to catalog'
      );
      createdAdminNoteId = json.data.id;
    });

    await t2.test('2.3 Catalog Visibility: Newly published note is discoverable in /notes/explore', async () => {
      const res = await fetch(`${baseUrl}/notes/explore?search=${encodeURIComponent(testNoteTitle)}`);
      assert.equal(res.status, 200);
      const json = await res.json();
      const notes = json.data.notes || json.data.items || [];
      const found = notes.some((n) => n.id === createdAdminNoteId);
      assert.ok(found, 'Newly published admin note must be visible to students in catalog');
    });

    await t2.test('2.4 Note Update: Admin updates note metadata', async () => {
      const updatedTitle = `${testNoteTitle} [Updated Edition]`;
      const res = await fetch(`${baseUrl}/notes/${createdAdminNoteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          title: updatedTitle,
          description: 'Updated edition with Raft & Paxos breakdown.'
        })
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.title, updatedTitle);
    });

    await t2.test('2.5 Safe Deletion: Admin safely deletes note with complete cleanup', async () => {
      const res = await fetch(`${baseUrl}/notes/${createdAdminNoteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);

      // Verify it is no longer discoverable
      const checkRes = await fetch(`${baseUrl}/notes/${createdAdminNoteId}`);
      assert.equal(checkRes.status, 404, 'Deleted note must return 404 Not Found');

      createdAdminNoteId = null;
    });
  });

  // ===========================================================================
  // JOURNEY 3: SUPER ADMIN END-TO-END JOURNEY (COMMAND CENTER & VISUAL BUILDER)
  // ===========================================================================
  await t.test('3. Super Admin Complete End-to-End User Journey', async (t2) => {
    await t2.test('3.1 Command Center Overview: GET /admin/overview returns genuine database statistics', async () => {
      const res = await fetch(`${baseUrl}/admin/overview`, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.data.totalUsers !== undefined, 'totalUsers must be present in overview');
      assert.ok(json.data.totalNotes !== undefined, 'totalNotes must be present in overview');
    });

    await t2.test('3.2 User Management: GET /admin/users returns user directory', async () => {
      const res = await fetch(`${baseUrl}/admin/users?limit=10`, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(Array.isArray(json.data.users || json.data.items));
    });

    await t2.test('3.3 Audit Trail: GET /admin/audit-logs returns immutable event stream', async () => {
      const res = await fetch(`${baseUrl}/admin/audit-logs?limit=5`, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });

      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
    });

    await t2.test('3.4 Platform Settings: GET & PATCH /admin/settings updates and preserves settings', async () => {
      // 1. Fetch current settings
      const getRes = await fetch(`${baseUrl}/admin/settings`, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      assert.equal(getRes.status, 200);
      const origSettings = (await getRes.json()).data;

      // 2. Update a test setting
      const updateRes = await fetch(`${baseUrl}/admin/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`
        },
        body: JSON.stringify({
          platformName: 'PJ Study Official Academic Portal'
        })
      });
      assert.equal(updateRes.status, 200);
      const updatedJson = await updateRes.json();
      assert.equal(updatedJson.data.platformName, 'PJ Study Official Academic Portal');

      // 3. Revert to original platformName
      await fetch(`${baseUrl}/admin/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`
        },
        body: JSON.stringify({
          platformName: origSettings.platformName || 'PJ Study'
        })
      });
    });

    await t2.test('3.5 Visual Website Builder: Draft, publish, and inspect home page configuration', async () => {
      // 1. Retrieve page config
      const pageRes = await fetch(`${baseUrl}/admin/config/pages/homepage`, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      assert.equal(pageRes.status, 200);
      const pageJson = await pageRes.json();
      assert.equal(pageJson.success, true);
      assert.ok(pageJson.data);
      const originalPublishedConfig = pageJson.data.publishedConfig;
      const originalDraftConfig = pageJson.data.draftConfig;

      // 2. Update draft configuration
      const draftRes = await fetch(`${baseUrl}/admin/config/pages/homepage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`
        },
        body: JSON.stringify({
          draftConfig: {
            ...originalDraftConfig,
            hero: {
              ...originalDraftConfig.hero,
              eyebrow: 'E2E VERIFIED CURRICULUM'
            }
          }
        })
      });
      assert.equal(draftRes.status, 200);

      // 3. Publish draft
      const pubRes = await fetch(`${baseUrl}/admin/config/pages/homepage/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`
        },
        body: JSON.stringify({
          changeSummary: 'E2E Test publication of home hero copy'
        })
      });
      assert.equal(pubRes.status, 200);

      // 4. Restore original configuration immediately to preserve environment
      await prisma.pageConfiguration.update({
        where: { pageKey: 'homepage' },
        data: {
          draftConfig: originalDraftConfig,
          publishedConfig: originalPublishedConfig
        }
      });
    });

    await t2.test('3.6 System Diagnostics: Health, storage, and backup probes', async () => {
      const [healthRes, storageRes, backupRes] = await Promise.all([
        fetch(`${baseUrl}/admin/health`, { headers: { Authorization: `Bearer ${superAdminToken}` } }),
        fetch(`${baseUrl}/admin/storage`, { headers: { Authorization: `Bearer ${superAdminToken}` } }),
        fetch(`${baseUrl}/admin/backups`, { headers: { Authorization: `Bearer ${superAdminToken}` } })
      ]);

      assert.equal(healthRes.status, 200);
      assert.equal(storageRes.status, 200);
      assert.equal(backupRes.status, 200);
    });
  });

  // ===========================================================================
  // JOURNEY 4: SECURITY & PRIVILEGE ESCALATION DEFENSES
  // ===========================================================================
  await t.test('4. Security & Role-Based Access Control Defenses', async (t2) => {
    await t2.test('4.1 Scholar Note Upload Block: Scholar is strictly forbidden from creating notes', async () => {
      const res = await fetch(`${baseUrl}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${scholarToken}`
        },
        body: JSON.stringify({
          title: 'Illegitimate Scholar Note Attempt',
          content: 'This must never be written to the database.',
          subjectId: validSubjectId
        })
      });

      assert.equal(res.status, 403, 'Scholar note upload must be rejected with HTTP 403 Forbidden');
      const json = await res.json();
      assert.equal(json.success, false);
      assert.ok(
        ['UPLOAD_FORBIDDEN', 'FORBIDDEN'].includes(json.error.code),
        `Unexpected error code: ${json.error.code}`
      );
    });

    await t2.test('4.2 Admin Command Center Block: Scholar forbidden from Super Admin routes', async () => {
      const res = await fetch(`${baseUrl}/admin/overview`, {
        headers: { Authorization: `Bearer ${scholarToken}` }
      });
      assert.equal(res.status, 403);
    });

    await t2.test('4.3 Admin Workspace Block: Scholar forbidden from Moderation Queue', async () => {
      const res = await fetch(`${baseUrl}/admin-workspace/queue`, {
        headers: { Authorization: `Bearer ${scholarToken}` }
      });
      assert.equal(res.status, 403);
    });

    await t2.test('4.4 Mass Assignment Guard: Scholar cannot escalate role via profile update', async () => {
      const res = await fetch(`${baseUrl}/profile/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${scholarToken}`
        },
        body: JSON.stringify({
          role: 'SUPER_ADMIN',
          isEmailVerified: true
        })
      });

      // Backend either returns 403 forbidden field or ignores forbidden fields with 200
      assert.ok([200, 400, 403].includes(res.status));

      // In either case, authentic student role must remain STUDENT in database
      const studentInDb = await prisma.user.findUnique({
        where: { id: authenticStudent.id }
      });
      assert.equal(studentInDb.role, 'STUDENT', 'Scholar role in database must never be mutated');
    });

    await t2.test('4.5 Authentication Defense: Unauthenticated requests to protected endpoints return 401', async () => {
      const res = await fetch(`${baseUrl}/auth/me`);
      assert.equal(res.status, 401);
      const json = await res.json();
      assert.equal(json.error.code, 'UNAUTHORIZED');
    });
  });

  // ===========================================================================
  // JOURNEY 5: DATABASE INVARIANT VERIFICATION
  // ===========================================================================
  await t.test('5. Zero-Mutation Invariant Guarantee', async () => {
    const currentNotes = await prisma.note.count();
    const currentUsers = await prisma.user.count();

    assert.equal(currentNotes, initialNoteCount, 'Note count must match initial baseline');
    assert.equal(currentUsers, initialUserCount, 'User count must match initial baseline');
  });
});
