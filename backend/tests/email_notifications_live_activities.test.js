import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { io as Client } from 'socket.io-client';
import app from '../src/app.js';
import prisma from '../src/config/database.js';
import emailService from '../src/services/email/email.service.js';
import { initializeSocketServer, closeSocketServer } from '../src/services/realtime/socket.service.js';
import { generateAccessToken } from '../src/services/tokens/token.service.js';

test('PJ Study — Email Authentication, Notifications & Live Activities Test Suite', async (t) => {
  let server;
  let baseUrl;
  let port;

  // 1. Setup ephemeral test server with Socket.IO
  await new Promise((resolve) => {
    server = http.createServer(app);
    initializeSocketServer(server);
    server.listen(0, () => {
      port = server.address().port;
      baseUrl = `http://localhost:${port}/api/v1`;
      resolve();
    });
  });

  t.after(async () => {
    await closeSocketServer();
    await new Promise((resolve) => server.close(resolve));
  });

  // Find or use authentic users
  const superAdmin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  const scholar = await prisma.user.findFirst({ where: { role: 'STUDENT' } });

  assert.ok(superAdmin, 'Super Admin required for test suite');
  assert.ok(scholar, 'Scholar user required for test suite');

  const superAdminToken = generateAccessToken({
    id: superAdmin.id,
    email: superAdmin.email,
    role: superAdmin.role
  });

  const scholarToken = generateAccessToken({
    id: scholar.id,
    email: scholar.email,
    role: scholar.role
  });

  // Test state
  const testEmail = `test_scholar_${Date.now()}@pjstudy.com`;
  const testPassword = 'Password123!';
  let createdUserId = null;
  let createdUserToken = null;

  // =========================================================================
  // SUITE 1: SIGNUP & AUTHENTICATION EMAIL FEATURES
  // =========================================================================
  await t.test('1.1 User Signup dispatches Welcome and Verification emails, and records live activity', async () => {
    const signupRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Email Test Scholar',
        email: testEmail,
        password: testPassword
      })
    });

    assert.equal(signupRes.status, 201, 'Signup should succeed with HTTP 201');
    const signupData = await signupRes.json();
    assert.equal(signupData.success, true);
    createdUserId = signupData.data.id || signupData.data.user?.id;

    // Check verification token was generated
    const verificationToken = await prisma.emailVerificationToken.findFirst({
      where: { userId: createdUserId }
    });
    assert.ok(verificationToken, 'Verification token must exist in database');

    // Wait brief moment for background async email logging
    await new Promise((r) => setTimeout(r, 600));

    // Check EmailDeliveryLog for welcome email
    const welcomeLog = await prisma.emailDeliveryLog.findFirst({
      where: { recipient: testEmail, templateKey: 'welcome_email' }
    });
    assert.ok(welcomeLog, 'Welcome email delivery log should be recorded');
    assert.equal(welcomeLog.status, 'SENT');

    // Check LiveActivity table for user registration
    const registerActivity = await prisma.liveActivity.findFirst({
      where: { action: 'USER_REGISTERED', actorId: createdUserId }
    });
    assert.ok(registerActivity, 'Live activity must record USER_REGISTERED');
  });

  await t.test('1.2 Prevent duplicate email registrations', async () => {
    const dupRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Scholar',
        email: testEmail,
        password: testPassword
      })
    });

    assert.equal(dupRes.status, 409, 'Duplicate signup must return HTTP 409 Conflict');
    const dupData = await dupRes.json();
    assert.equal(dupData.success, false);
  });

  await t.test('1.3 User Login dispatches Login Security Alert and logs LiveActivity', async () => {
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': 'PJStudy-Automated-Test-Client' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });

    assert.equal(loginRes.status, 200, 'Login should succeed with HTTP 200');
    const loginData = await loginRes.json();
    assert.equal(loginData.success, true);
    createdUserToken = loginData.data.accessToken;

    // Wait brief moment for background email logging
    await new Promise((r) => setTimeout(r, 600));

    const loginAlertLog = await prisma.emailDeliveryLog.findFirst({
      where: { recipient: testEmail, templateKey: 'security_alert_login' }
    });
    assert.ok(loginAlertLog, 'Security login alert email log must be recorded');
    assert.equal(loginAlertLog.status, 'SENT');

    const loginActivity = await prisma.liveActivity.findFirst({
      where: { action: 'USER_LOGIN', actorId: createdUserId }
    });
    assert.ok(loginActivity, 'LiveActivity must record USER_LOGIN');
  });

  await t.test('1.4 Forgot Password and Password Changed workflow dispatches emails', async () => {
    // 1. Forgot password
    const forgotRes = await fetch(`${baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    assert.equal(forgotRes.status, 200);

    // Retrieve the reset token
    const resetTokenRecord = await prisma.passwordResetToken.findFirst({
      where: { userId: createdUserId },
      orderBy: { createdAt: 'desc' }
    });
    assert.ok(resetTokenRecord, 'Password reset token must be saved');

    // Retrieve raw token from emailService dispatch
    const tokenMatch = emailService.lastSentMessage?.text?.match(/token=([a-f0-9]+)/);
    const rawResetToken =
      tokenMatch?.[1] || resetTokenRecord.token || resetTokenRecord.tokenHash;

    // 2. Reset password
    const newPassword = 'NewSecretPassword456!';
    const resetRes = await fetch(`${baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: rawResetToken,
        password: newPassword
      })
    });
    assert.equal(resetRes.status, 200);

    await new Promise((r) => setTimeout(r, 600));

    // 3. Confirm password change alert was logged
    const pwdChangeLog = await prisma.emailDeliveryLog.findFirst({
      where: { recipient: testEmail, templateKey: 'security_alert_password_changed' }
    });
    assert.ok(pwdChangeLog, 'Password changed security alert must be recorded in email delivery log');
  });

  // =========================================================================
  // SUITE 2: EMAIL NOTIFICATION PREFERENCES
  // =========================================================================
  await t.test('2.1 Scholar can read and update email notification preferences', async () => {
    // GET initial preferences
    const getPrefsRes = await fetch(`${baseUrl}/notifications/preferences`, {
      headers: { Authorization: `Bearer ${createdUserToken}` }
    });
    assert.equal(getPrefsRes.status, 200);
    const prefsData = await getPrefsRes.json();
    assert.equal(prefsData.success, true);
    assert.equal(prefsData.data.emailSecurityAlerts, true, 'Default emailSecurityAlerts should be true');
    assert.equal(prefsData.data.emailNewNotes, true, 'Default emailNewNotes should be true');

    // PATCH preferences to disable emailSecurityAlerts
    const patchRes = await fetch(`${baseUrl}/notifications/preferences`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${createdUserToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        emailSecurityAlerts: false,
        emailNewNotes: false,
        emailAnnouncements: true,
        emailLiveActivity: false,
        emailWeeklyDigest: false
      })
    });
    assert.equal(patchRes.status, 200);
    const updatedData = await patchRes.json();
    assert.equal(updatedData.data.emailSecurityAlerts, false);
    assert.equal(updatedData.data.emailNewNotes, false);
    assert.equal(updatedData.data.emailAnnouncements, true);
  });

  await t.test('2.2 Disabled email preference suppresses non-critical security login email', async () => {
    // Count login alerts before login
    const countBefore = await prisma.emailDeliveryLog.count({
      where: { recipient: testEmail, templateKey: 'security_alert_login' }
    });

    // Log in with new password while emailSecurityAlerts is disabled
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'NewSecretPassword456!'
      })
    });
    assert.equal(loginRes.status, 200);

    await new Promise((r) => setTimeout(r, 600));

    // Confirm count did not increase because preference is false
    const countAfter = await prisma.emailDeliveryLog.count({
      where: { recipient: testEmail, templateKey: 'security_alert_login' }
    });
    assert.equal(countAfter, countBefore, 'Login security email should be suppressed when user preference is disabled');
  });

  // =========================================================================
  // SUITE 3: REAL-TIME SOCKET.IO ACTIVITIES
  // =========================================================================
  await t.test('3.1 Scholar can connect via Socket.IO with JWT authentication and receive live activity events', async () => {
    const socket = Client(`http://localhost:${port}`, {
      auth: { token: scholarToken },
      transports: ['websocket']
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Socket connection timed out')), 4000);
      socket.on('connect', () => {
        clearTimeout(timeout);
        assert.ok(socket.id, 'Socket must receive connection ID');
        resolve();
      });
      socket.on('connect_error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    // Listen for live activity
    const activityPromise = new Promise((resolve) => {
      socket.on('activity:live', (activity) => {
        resolve(activity);
      });
    });

    // Trigger an activity as Super Admin by posting a broadcast announcement
    const broadcastRes = await fetch(`${baseUrl}/admin/broadcast-email`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Real-time Test Announcement',
        message: 'This tests real-time broadcast and activity logging.',
        priority: 'NORMAL'
      })
    });
    assert.equal(broadcastRes.status, 200);

    const receivedActivity = await activityPromise;
    assert.ok(receivedActivity, 'Socket client must receive activity:live');
    assert.equal(receivedActivity.action, 'PLATFORM_BROADCAST');

    socket.disconnect();
  });

  // =========================================================================
  // SUITE 4: SUPER ADMIN EMAIL MANAGEMENT & RBAC ENFORCEMENT
  // =========================================================================
  await t.test('4.1 Super Admin can access email delivery logs, notification templates, and live activity stream', async () => {
    // 1. Email delivery logs
    const logsRes = await fetch(`${baseUrl}/admin/email-logs`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(logsRes.status, 200);
    const logsData = await logsRes.json();
    assert.equal(logsData.success, true);
    assert.ok(Array.isArray(logsData.data.logs), 'Logs must be an array');
    assert.ok(logsData.data.logs.length > 0, 'Should have logged email deliveries');

    // 2. Notification templates
    const templatesRes = await fetch(`${baseUrl}/admin/notification-templates`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(templatesRes.status, 200);
    const templatesData = await templatesRes.json();
    assert.equal(templatesData.success, true);
    assert.ok(Array.isArray(templatesData.data), 'Templates must be an array');
    const welcomeTemplate = templatesData.data.find((t) => t.key === 'welcome_email');
    assert.ok(welcomeTemplate, 'welcome_email template must be seeded and retrieved');

    // 3. Update notification template
    const updateTplRes = await fetch(`${baseUrl}/admin/notification-templates/welcome_email`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${superAdminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject: 'Welcome to PJ Study Academic Platform!',
        description: 'Updated welcome template for scholars'
      })
    });
    assert.equal(updateTplRes.status, 200);
    const updateTplData = await updateTplRes.json();
    assert.equal(updateTplData.data.subject, 'Welcome to PJ Study Academic Platform!');

    // 4. Live activity endpoint
    const activityRes = await fetch(`${baseUrl}/admin/live-activity`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(activityRes.status, 200);
    const activityData = await activityRes.json();
    assert.equal(activityData.success, true);
    assert.ok(Array.isArray(activityData.data), 'Activity data must be an array');
  });

  await t.test('4.2 Super Admin can retry failed email delivery', async () => {
    // Create a mock failed email log
    const failedLog = await prisma.emailDeliveryLog.create({
      data: {
        recipient: 'failed_test@pjstudy.com',
        subject: 'Failed Test Email',
        templateKey: 'SECURITY_LOGIN_ALERT',
        status: 'FAILED',
        errorMessage: 'Simulated connection reset',
        attempts: 2,
        metadata: { clientIp: '127.0.0.1' }
      }
    });

    const retryRes = await fetch(`${baseUrl}/admin/email-logs/${failedLog.id}/retry`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert.equal(retryRes.status, 200);
    const retryData = await retryRes.json();
    assert.equal(retryData.success, true);
    assert.equal(retryData.data.status, 'SENT', 'Retried email should succeed in dev/test environment');

    // Clean up mock failed log
    await prisma.emailDeliveryLog.delete({ where: { id: failedLog.id } }).catch(() => {});
  });

  await t.test('4.3 Scholar is strictly denied access (HTTP 403) to all Admin Email endpoints', async () => {
    const endpoints = [
      { method: 'GET', url: `${baseUrl}/admin/email-logs` },
      { method: 'GET', url: `${baseUrl}/admin/notification-templates` },
      { method: 'PUT', url: `${baseUrl}/admin/notification-templates/WELCOME_EMAIL` },
      { method: 'POST', url: `${baseUrl}/admin/broadcast-email` }
    ];

    for (const ep of endpoints) {
      const res = await fetch(ep.url, {
        method: ep.method,
        headers: {
          Authorization: `Bearer ${scholarToken}`,
          'Content-Type': 'application/json'
        },
        body: ep.method === 'POST' || ep.method === 'PUT' ? JSON.stringify({ test: 1 }) : undefined
      });
      assert.equal(
        res.status,
        403,
        `Scholar must receive HTTP 403 Forbidden on ${ep.method} ${ep.url}`
      );
    }
  });

  // Cleanup test user created in suite 1
  if (createdUserId) {
    await prisma.notificationPreference.deleteMany({ where: { userId: createdUserId } }).catch(() => {});
    await prisma.emailVerificationToken.deleteMany({ where: { userId: createdUserId } }).catch(() => {});
    await prisma.passwordResetToken.deleteMany({ where: { userId: createdUserId } }).catch(() => {});
    await prisma.emailDeliveryLog.deleteMany({ where: { recipient: testEmail } }).catch(() => {});
    await prisma.liveActivity.deleteMany({ where: { actorId: createdUserId } }).catch(() => {});
    await prisma.user.delete({ where: { id: createdUserId } }).catch(() => {});
  }
});
