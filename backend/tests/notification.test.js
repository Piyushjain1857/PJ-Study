import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'http';
import app from '../src/app.js';
import prisma from '../src/config/database.js';
import { generateAccessToken } from '../src/services/tokens/token.service.js';
import notificationService from '../src/modules/notifications/notification.service.js';
import announcementService from '../src/modules/notifications/announcement.service.js';

test('Enterprise Notifications & Activity Center Suite', async (t) => {
  let server;
  let baseUrl;

  // Helper HTTP request function using native Node fetch
  async function api(path, options = {}) {
    const { method = 'GET', token, body } = options;
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });

    let resBody = null;
    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      resBody = await res.json();
    } else {
      resBody = await res.text();
    }

    return {
      status: res.status,
      body: resBody
    };
  }

  // Test fixture IDs
  const testStudentA = {
    id: 'notif-user-student-a',
    name: 'Notification Student Alice',
    email: 'notif_student_a@pjstudy.com',
    role: 'STUDENT',
    isActive: true,
    isEmailVerified: true
  };

  const testStudentB = {
    id: 'notif-user-student-b',
    name: 'Notification Student Bob',
    email: 'notif_student_b@pjstudy.com',
    role: 'STUDENT',
    isActive: true,
    isEmailVerified: true
  };

  const testModerator = {
    id: 'notif-user-moderator',
    name: 'Notification Moderator Mark',
    email: 'notif_moderator@pjstudy.com',
    role: 'MODERATOR',
    isActive: true,
    isEmailVerified: true
  };

  const testAdmin = {
    id: 'notif-user-admin',
    name: 'Notification Admin Alex',
    email: 'notif_admin@pjstudy.com',
    role: 'ADMIN',
    isActive: true,
    isEmailVerified: true
  };

  // Generate tokens
  const tokenStudentA = generateAccessToken(testStudentA);
  const tokenStudentB = generateAccessToken(testStudentB);
  const tokenAdmin = generateAccessToken(testAdmin);

  // Setup database fixtures
  t.before(async () => {
    server = createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    const port = server.address().port;
    baseUrl = `http://localhost:${port}/api/v1`;

    // Clean any previous test relics
    await prisma.notification.deleteMany({
      where: {
        OR: [
          { userId: { in: [testStudentA.id, testStudentB.id, testModerator.id, testAdmin.id] } },
          { eventKey: { startsWith: 'announcement_' } },
          { title: { contains: 'Spring Semester Midterms' } },
          { title: { contains: 'Moderator Policy Update' } }
        ]
      }
    });
    await prisma.notificationPreference.deleteMany({
      where: {
        userId: { in: [testStudentA.id, testStudentB.id, testModerator.id, testAdmin.id] }
      }
    });
    await prisma.announcement.deleteMany({
      where: {
        OR: [
          { createdById: testAdmin.id },
          { title: { contains: 'Spring Semester Midterms' } },
          { title: { contains: 'Moderator Policy Update' } }
        ]
      }
    });
    await prisma.user.deleteMany({
      where: {
        id: { in: [testStudentA.id, testStudentB.id, testModerator.id, testAdmin.id] }
      }
    });

    // Seed test users
    for (const u of [testStudentA, testStudentB, testModerator, testAdmin]) {
      await prisma.user.create({
        data: {
          id: u.id,
          name: u.name,
          email: u.email,
          passwordHash: 'hashed_password_for_testing',
          role: u.role,
          isActive: u.isActive,
          isEmailVerified: u.isEmailVerified
        }
      });
    }
  });

  t.after(async () => {
    // Teardown test fixtures
    await prisma.notification.deleteMany({
      where: {
        OR: [
          { userId: { in: [testStudentA.id, testStudentB.id, testModerator.id, testAdmin.id] } },
          { eventKey: { startsWith: 'announcement_' } },
          { title: { contains: 'Spring Semester Midterms' } },
          { title: { contains: 'Moderator Policy Update' } }
        ]
      }
    });
    await prisma.notificationPreference.deleteMany({
      where: {
        userId: { in: [testStudentA.id, testStudentB.id, testModerator.id, testAdmin.id] }
      }
    });
    await prisma.announcement.deleteMany({
      where: {
        OR: [
          { createdById: testAdmin.id },
          { title: { contains: 'Spring Semester Midterms' } },
          { title: { contains: 'Moderator Policy Update' } }
        ]
      }
    });
    await prisma.user.deleteMany({
      where: {
        id: { in: [testStudentA.id, testStudentB.id, testModerator.id, testAdmin.id] }
      }
    });

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  let createdNotificationId = null;

  // ---------------------------------------------------------------------------
  // 1. Notification Creation from Genuine Events
  // ---------------------------------------------------------------------------
  await t.test('1. Create notification from genuine event', async () => {
    const notif = await notificationService.createNotification({
      userId: testStudentA.id,
      type: 'NOTE_APPROVED',
      category: 'ACADEMIC',
      title: 'Note Approved',
      message: 'Your manuscript "Algorithms 101" has been approved.',
      targetUrl: '/notes/test-note-1',
      eventKey: 'note_approved_test_note_1',
      metadata: { noteTitle: 'Algorithms 101' }
    });

    assert.ok(notif?.id);
    assert.equal(notif.userId, testStudentA.id);
    assert.equal(notif.type, 'NOTE_APPROVED');
    assert.equal(notif.category, 'ACADEMIC');
    assert.equal(notif.isRead, false);
    assert.equal(notif.targetUrl, '/notes/test-note-1');

    createdNotificationId = notif.id;
  });

  // ---------------------------------------------------------------------------
  // 2. Event Key Deduplication Invariant
  // ---------------------------------------------------------------------------
  await t.test('2. Prevent duplicate event notifications (eventKey deduplication)', async () => {
    // Attempt to create notification with same eventKey
    const duplicate = await notificationService.createNotification({
      userId: testStudentA.id,
      type: 'NOTE_APPROVED',
      category: 'ACADEMIC',
      title: 'Note Approved Duplicate',
      message: 'Duplicate event attempt.',
      eventKey: 'note_approved_test_note_1'
    });

    // Must return the existing record and not create a duplicate in DB
    assert.equal(duplicate.id, createdNotificationId);

    const count = await prisma.notification.count({
      where: { eventKey: 'note_approved_test_note_1' }
    });
    assert.equal(count, 1);

    // Sliding window fallback deduplication when eventKey is omitted
    const noKey1 = await notificationService.createNotification({
      userId: testStudentA.id,
      type: 'SECURITY_ALERT',
      category: 'SECURITY',
      title: 'Suspicious Activity Detected',
      message: 'A login attempt from a new location was recorded.'
    });
    assert.ok(noKey1?.id);

    const noKey2 = await notificationService.createNotification({
      userId: testStudentA.id,
      type: 'SECURITY_ALERT',
      category: 'SECURITY',
      title: 'Suspicious Activity Detected',
      message: 'A login attempt from a new location was recorded.'
    });
    assert.equal(
      noKey2.id,
      noKey1.id,
      'Sliding window deduplication must return existing notification record.'
    );
  });

  // ---------------------------------------------------------------------------
  // 3. Retrieve Own Notifications via API
  // ---------------------------------------------------------------------------
  await t.test('3. Retrieve own notifications with accurate payload envelope', async () => {
    const res = await api('/notifications', { token: tokenStudentA });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.notifications));
    assert.ok(res.body.data.notifications.length >= 1);
    assert.equal(res.body.data.unreadCount >= 1, true);
    assert.equal(res.body.data.pagination.page, 1);
  });

  // ---------------------------------------------------------------------------
  // 4. Block Cross-User Notification Access
  // ---------------------------------------------------------------------------
  await t.test(
    '4. Block cross-user access: Student B cannot read/modify Student A notifications',
    async () => {
      // Student B attempts to mark Student A's notification as read
      const patchRes = await api(`/notifications/${createdNotificationId}/read`, {
        method: 'PATCH',
        token: tokenStudentB
      });

      assert.equal(patchRes.status, 403);
      assert.equal(patchRes.body.success, false);
      assert.equal(patchRes.body.error.code, 'NOTIFICATION_FORBIDDEN');

      // Student B attempts to delete Student A's notification
      const deleteRes = await api(`/notifications/${createdNotificationId}`, {
        method: 'DELETE',
        token: tokenStudentB
      });

      assert.equal(deleteRes.status, 403);
      assert.equal(deleteRes.body.success, false);
    }
  );

  // ---------------------------------------------------------------------------
  // 5. Retrieve Unread Count
  // ---------------------------------------------------------------------------
  await t.test('5. Retrieve accurate unread notification count', async () => {
    const res = await api('/notifications/unread-count', { token: tokenStudentA });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(typeof res.body.data.unreadCount, 'number');
    assert.ok(res.body.data.unreadCount >= 1);
  });

  // ---------------------------------------------------------------------------
  // 6. Mark Single Notification as Read
  // ---------------------------------------------------------------------------
  await t.test('6. Mark single notification as read', async () => {
    const res = await api(`/notifications/${createdNotificationId}/read`, {
      method: 'PATCH',
      token: tokenStudentA
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.isRead, true);
    assert.ok(res.body.data.readAt !== null);

    // Verify idempotent re-call
    const reRes = await api(`/notifications/${createdNotificationId}/read`, {
      method: 'PATCH',
      token: tokenStudentA
    });
    assert.equal(reRes.status, 200);
    assert.equal(reRes.body.data.isRead, true);
  });

  // ---------------------------------------------------------------------------
  // 7. Mark All Notifications as Read
  // ---------------------------------------------------------------------------
  await t.test('7. Mark all notifications as read in single batch', async () => {
    // Create 2 unread notifications for Student A
    await notificationService.createNotification({
      userId: testStudentA.id,
      type: 'NEW_REVIEW',
      category: 'REVIEWS',
      title: 'Review A',
      message: 'Review msg A',
      eventKey: 'batch_notif_1'
    });
    await notificationService.createNotification({
      userId: testStudentA.id,
      type: 'HELPFUL_VOTE',
      category: 'COMMUNITY',
      title: 'Vote B',
      message: 'Vote msg B',
      eventKey: 'batch_notif_2'
    });

    const unreadBefore = await notificationService.getUnreadCount(testStudentA.id);
    assert.ok(unreadBefore.unreadCount >= 2);

    const res = await api('/notifications/read-all', {
      method: 'PATCH',
      token: tokenStudentA
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.updatedCount >= 2);

    const unreadAfter = await notificationService.getUnreadCount(testStudentA.id);
    assert.equal(unreadAfter.unreadCount, 0);
  });

  // ---------------------------------------------------------------------------
  // 8. Dismiss / Delete Notification
  // ---------------------------------------------------------------------------
  await t.test('8. Dismiss notification permanently', async () => {
    const res = await api(`/notifications/${createdNotificationId}`, {
      method: 'DELETE',
      token: tokenStudentA
    });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    // Verify it no longer exists
    const inDb = await prisma.notification.findUnique({
      where: { id: createdNotificationId }
    });
    assert.equal(inDb, null);
  });

  // ---------------------------------------------------------------------------
  // 9. Filter Notifications by Read Status & Category
  // ---------------------------------------------------------------------------
  await t.test('9. Filter notifications by read status and academic category', async () => {
    // Create one unread ACADEMIC and one read REVIEWS
    const n1 = await notificationService.createNotification({
      userId: testStudentA.id,
      type: 'NOTE_REJECTED',
      category: 'ACADEMIC',
      title: 'Revision Needed',
      message: 'Needs format fix.',
      eventKey: 'filter_test_academic_1'
    });
    const n2 = await notificationService.createNotification({
      userId: testStudentA.id,
      type: 'NEW_REVIEW',
      category: 'REVIEWS',
      title: 'New Star Rating',
      message: '5 stars received.',
      eventKey: 'filter_test_review_1'
    });
    await notificationService.markAsRead(testStudentA.id, n2.id);

    // Query unread only
    const unreadRes = await api('/notifications?status=unread', { token: tokenStudentA });
    assert.equal(unreadRes.status, 200);
    for (const item of unreadRes.body.data.notifications) {
      assert.equal(item.isRead, false);
    }

    // Query ACADEMIC category only
    const categoryRes = await api('/notifications?category=ACADEMIC', { token: tokenStudentA });
    assert.equal(categoryRes.status, 200);
    for (const item of categoryRes.body.data.notifications) {
      assert.equal(item.category, 'ACADEMIC');
    }
  });

  // ---------------------------------------------------------------------------
  // 10. Pagination Bounds & Metadata
  // ---------------------------------------------------------------------------
  await t.test('10. Bounded pagination parameters and metadata structure', async () => {
    const res = await api('/notifications?page=1&limit=2', { token: tokenStudentA });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.pagination.page, 1);
    assert.equal(res.body.data.pagination.limit, 2);
    assert.ok(res.body.data.notifications.length <= 2);
    assert.ok(res.body.data.pagination.totalItems >= 2);
  });

  // ---------------------------------------------------------------------------
  // 11. Preferences Retrieval and Persistence
  // ---------------------------------------------------------------------------
  await t.test('11. Notification delivery preferences retrieval and persistence', async () => {
    // Get default preferences
    const getRes = await api('/notifications/preferences', { token: tokenStudentA });

    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.success, true);
    assert.equal(getRes.body.data.inAppEnabled, true);

    // Update preferences: turn off reviewActivity
    const patchRes = await api('/notifications/preferences', {
      method: 'PATCH',
      token: tokenStudentA,
      body: { reviewActivity: false }
    });

    assert.equal(patchRes.status, 200);
    assert.equal(patchRes.body.data.reviewActivity, false);

    // Verify persisted
    const verifyPref = await notificationService.getPreferences(testStudentA.id);
    assert.equal(verifyPref.reviewActivity, false);
  });

  // ---------------------------------------------------------------------------
  // 12. Preferences Enforcement
  // ---------------------------------------------------------------------------
  await t.test(
    '12. Preferences enforcement: Opted-out category does not deliver notification',
    async () => {
      // Student A disabled reviewActivity. Attempting to create a REVIEWS notification should return null.
      const suppressed = await notificationService.createNotification({
        userId: testStudentA.id,
        type: 'NEW_REVIEW',
        category: 'REVIEWS',
        title: 'Ignored Review',
        message: 'This should not be delivered.',
        eventKey: 'suppressed_review_1'
      });

      assert.equal(suppressed, null);

      const inDb = await prisma.notification.findUnique({
        where: { eventKey: 'suppressed_review_1' }
      });
      assert.equal(inDb, null);

      // Restore preference
      await notificationService.updatePreferences(testStudentA.id, { reviewActivity: true });
    }
  );

  // ---------------------------------------------------------------------------
  // 13. Admin Announcement Authorization
  // ---------------------------------------------------------------------------
  await t.test(
    '13. Admin announcements RBAC: Students rejected (403), Admins allowed (201)',
    async () => {
      // Student attempts to publish platform announcement
      const studentRes = await api('/admin/announcements', {
        method: 'POST',
        token: tokenStudentA,
        body: {
          title: 'Unauthorized Announcement',
          message: 'This must fail.'
        }
      });

      assert.equal(studentRes.status, 403);
      assert.equal(studentRes.body.success, false);

      // Admin publishes announcement
      const adminRes = await api('/admin/announcements', {
        method: 'POST',
        token: tokenAdmin,
        body: {
          title: 'Spring Semester Midterms Library',
          message: 'New curated study materials have been published for Computer Science.',
          targetAudience: 'ALL',
          targetUrl: '/notes/explore',
          priority: 'HIGH'
        }
      });

      assert.equal(adminRes.status, 201);
      assert.equal(adminRes.body.success, true);
      assert.ok(adminRes.body.data.announcement.id);
      assert.ok(adminRes.body.data.recipientCount >= 1);

      // Verify announcement deduplication suppresses redundant fan-out
      const duplicateRes = await api('/admin/announcements', {
        method: 'POST',
        token: tokenAdmin,
        body: {
          title: 'Spring Semester Midterms Library',
          message: 'New curated study materials have been published for Computer Science.',
          targetAudience: 'ALL',
          targetUrl: '/notes/explore',
          priority: 'HIGH'
        }
      });
      assert.equal(duplicateRes.status, 201);
      assert.equal(
        duplicateRes.body.data.recipientCount,
        0,
        'Duplicate announcement must not fan out repeatedly'
      );
    }
  );

  // ---------------------------------------------------------------------------
  // 14. Announcement Audience Targeting
  // ---------------------------------------------------------------------------
  await t.test('14. Announcement audience targeting and delivery fan-out', async () => {
    // Send announcement targeted strictly to MODERATOR
    const targetRes = await announcementService.createAnnouncement(testAdmin.id, {
      title: 'Moderator Policy Update',
      message: 'Please review updated peer-review rubrics.',
      targetAudience: 'MODERATOR',
      targetUrl: '/admin'
    });

    assert.ok(targetRes.announcement.id);

    // Moderator should have received notification
    const modNotifs = await prisma.notification.findMany({
      where: {
        userId: testModerator.id,
        type: 'SYSTEM_ANNOUNCEMENT'
      }
    });
    assert.ok(modNotifs.length >= 1);

    // Student A should NOT have received this moderator-only notification
    const studentNotifs = await prisma.notification.findMany({
      where: {
        userId: testStudentA.id,
        type: 'SYSTEM_ANNOUNCEMENT'
      }
    });
    const matchingNotifs = studentNotifs.filter(
      (n) => n.metadata && n.metadata.announcementId === targetRes.announcement.id
    );
    assert.equal(matchingNotifs.length, 0);
  });

  // ---------------------------------------------------------------------------
  // 15. Invalid Destination URL Rejection
  // ---------------------------------------------------------------------------
  await t.test('15. Rejection of dangerous or external target URLs in announcements', async () => {
    const maliciousUrls = [
      'https://malicious.com/phishing',
      'javascript:alert(1)',
      '//evil.com',
      'ftp://files.com'
    ];

    for (const badUrl of maliciousUrls) {
      const res = await api('/admin/announcements', {
        method: 'POST',
        token: tokenAdmin,
        body: {
          title: 'Dangerous Link Test',
          message: 'Safe body content.',
          targetUrl: badUrl
        }
      });

      assert.equal(res.status, 400);
      assert.equal(res.body.success, false);
      assert.equal(res.body.error.code, 'VALIDATION_FAILED');
    }
  });

  // ---------------------------------------------------------------------------
  // 16. Transactional Consistency
  // ---------------------------------------------------------------------------
  await t.test(
    '16. Transactional consistency: Rollback on error prevents partial records',
    async () => {
      const rollbackKey = 'tx_consistency_test_key';

      try {
        await prisma.$transaction(async (tx) => {
          await notificationService.createNotification(
            {
              userId: testStudentA.id,
              type: 'NOTE_APPROVED',
              category: 'ACADEMIC',
              title: 'Tx Test',
              message: 'Must roll back',
              eventKey: rollbackKey
            },
            tx
          );
          // Force intentional rollback
          throw new Error('Simulated transaction failure');
        });
      } catch {
        // Expected rollback
      }

      const inDb = await prisma.notification.findUnique({
        where: { eventKey: rollbackKey }
      });
      assert.equal(inDb, null, 'Notification must not exist after transaction rollback.');
    }
  );

  // ---------------------------------------------------------------------------
  // 17. Unauthenticated Request Rejection
  // ---------------------------------------------------------------------------
  await t.test(
    '17. Reject unauthenticated requests across all notification endpoints',
    async () => {
      assert.equal((await api('/notifications')).status, 401);
      assert.equal((await api('/notifications/unread-count')).status, 401);
      assert.equal((await api('/notifications/read-all', { method: 'PATCH' })).status, 401);
      assert.equal((await api('/notifications/sample-id/read', { method: 'PATCH' })).status, 401);
      assert.equal((await api('/notifications/sample-id', { method: 'DELETE' })).status, 401);
      assert.equal((await api('/notifications/preferences')).status, 401);
      assert.equal(
        (await api('/notifications/preferences', { method: 'PATCH', body: {} })).status,
        401
      );
    }
  );
});
