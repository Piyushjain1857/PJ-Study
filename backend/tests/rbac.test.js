import test from 'node:test';
import assert from 'node:assert/strict';
import { PERMISSIONS } from '../src/auth/permissions.js';
import {
  ROLES,
  ROLE_PERMISSIONS,
  hasPermission,
  getPermissionsForRole,
  canRoleManageTarget
} from '../src/auth/rolePermissions.js';
import { assertNoteOwnership } from '../src/auth/ownership.js';
import { generateAccessToken } from '../src/services/tokens/token.service.js';
import app from '../src/app.js';
import prisma from '../src/config/database.js';

test('RBAC Matrix and Capability Invariants', async (t) => {
  await t.test('Student capabilities should match matrix', () => {
    assert.equal(hasPermission(ROLES.STUDENT, PERMISSIONS.NOTES_READ), true);
    assert.equal(hasPermission(ROLES.STUDENT, PERMISSIONS.NOTES_CREATE), true);
    assert.equal(hasPermission(ROLES.STUDENT, PERMISSIONS.NOTES_UPDATE_OWN), true);
    assert.equal(hasPermission(ROLES.STUDENT, PERMISSIONS.NOTES_DELETE_OWN), true);
    assert.equal(hasPermission(ROLES.STUDENT, PERMISSIONS.NOTES_SUBMIT_REVIEW), true);

    // Forbidden for Student
    assert.equal(hasPermission(ROLES.STUDENT, PERMISSIONS.NOTES_REVIEW), false);
    assert.equal(hasPermission(ROLES.STUDENT, PERMISSIONS.NOTES_APPROVE), false);
    assert.equal(hasPermission(ROLES.STUDENT, PERMISSIONS.CATEGORIES_MANAGE), false);
    assert.equal(hasPermission(ROLES.STUDENT, PERMISSIONS.USERS_READ), false);
    assert.equal(hasPermission(ROLES.STUDENT, PERMISSIONS.USERS_CHANGE_ROLE), false);
    assert.equal(hasPermission(ROLES.STUDENT, PERMISSIONS.AUDIT_LOGS_READ), false);
  });

  await t.test('Moderator capabilities should include notes review but not user management', () => {
    assert.equal(hasPermission(ROLES.MODERATOR, PERMISSIONS.NOTES_READ), true);
    assert.equal(hasPermission(ROLES.MODERATOR, PERMISSIONS.NOTES_REVIEW), true);
    assert.equal(hasPermission(ROLES.MODERATOR, PERMISSIONS.NOTES_APPROVE), true);
    assert.equal(hasPermission(ROLES.MODERATOR, PERMISSIONS.NOTES_REJECT), true);

    // Forbidden for Moderator
    assert.equal(hasPermission(ROLES.MODERATOR, PERMISSIONS.CATEGORIES_MANAGE), false);
    assert.equal(hasPermission(ROLES.MODERATOR, PERMISSIONS.USERS_READ), false);
    assert.equal(hasPermission(ROLES.MODERATOR, PERMISSIONS.USERS_CHANGE_ROLE), false);
    assert.equal(hasPermission(ROLES.MODERATOR, PERMISSIONS.SETTINGS_MANAGE), false);
  });

  await t.test('Admin capabilities should include user management and audit logs', () => {
    assert.equal(hasPermission(ROLES.ADMIN, PERMISSIONS.CATEGORIES_MANAGE), true);
    assert.equal(hasPermission(ROLES.ADMIN, PERMISSIONS.USERS_READ), true);
    assert.equal(hasPermission(ROLES.ADMIN, PERMISSIONS.USERS_UPDATE), true);
    assert.equal(hasPermission(ROLES.ADMIN, PERMISSIONS.USERS_SUSPEND), true);
    assert.equal(hasPermission(ROLES.ADMIN, PERMISSIONS.USERS_CHANGE_ROLE), true);
    assert.equal(hasPermission(ROLES.ADMIN, PERMISSIONS.AUDIT_LOGS_READ), true);

    // Forbidden for Admin (Super Admin exclusive)
    assert.equal(hasPermission(ROLES.ADMIN, PERMISSIONS.MODERATORS_MANAGE), false);
    assert.equal(hasPermission(ROLES.ADMIN, PERMISSIONS.ADMINS_MANAGE), false);
    assert.equal(hasPermission(ROLES.ADMIN, PERMISSIONS.SETTINGS_MANAGE), false);
  });

  await t.test('Super Admin should possess full system capabilities', () => {
    const allPermissions = Object.values(PERMISSIONS);
    for (const perm of allPermissions) {
      assert.equal(
        hasPermission(ROLES.SUPER_ADMIN, perm),
        true,
        `Super Admin should hold permission "${perm}"`
      );
    }
  });

  await t.test(
    'canRoleManageTarget should enforce strict hierarchical role management rules',
    () => {
      // Admin CANNOT promote to Super Admin
      const adminToSuper = canRoleManageTarget(ROLES.ADMIN, ROLES.STUDENT, ROLES.SUPER_ADMIN);
      assert.equal(adminToSuper.allowed, false);

      // Admin CANNOT assign Admin role
      const adminToAdmin = canRoleManageTarget(ROLES.ADMIN, ROLES.STUDENT, ROLES.ADMIN);
      assert.equal(adminToAdmin.allowed, false);

      // Admin CANNOT modify an existing Admin or Super Admin
      const adminModAdmin = canRoleManageTarget(ROLES.ADMIN, ROLES.ADMIN, ROLES.STUDENT);
      assert.equal(adminModAdmin.allowed, false);

      const adminModSuper = canRoleManageTarget(ROLES.ADMIN, ROLES.SUPER_ADMIN, ROLES.STUDENT);
      assert.equal(adminModSuper.allowed, false);

      // Admin CAN promote Student to Moderator
      const adminStudentToMod = canRoleManageTarget(ROLES.ADMIN, ROLES.STUDENT, ROLES.MODERATOR);
      assert.equal(adminStudentToMod.allowed, true);

      // Admin CAN demote Moderator to Student
      const adminModToStudent = canRoleManageTarget(ROLES.ADMIN, ROLES.MODERATOR, ROLES.STUDENT);
      assert.equal(adminModToStudent.allowed, true);

      // Super Admin CAN assign any role
      assert.equal(
        canRoleManageTarget(ROLES.SUPER_ADMIN, ROLES.STUDENT, ROLES.ADMIN).allowed,
        true
      );
      assert.equal(
        canRoleManageTarget(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SUPER_ADMIN).allowed,
        true
      );

      // Student or Moderator CANNOT manage any roles
      assert.equal(
        canRoleManageTarget(ROLES.STUDENT, ROLES.STUDENT, ROLES.MODERATOR).allowed,
        false
      );
      assert.equal(
        canRoleManageTarget(ROLES.MODERATOR, ROLES.STUDENT, ROLES.MODERATOR).allowed,
        false
      );
    }
  );
});

test('Resource Ownership-Based Authorization Invariants', async (t) => {
  const noteOwnerId = 'usr_author_123';
  const otherUserId = 'usr_intruder_456';

  const mockNote = {
    id: 'note_test_001',
    title: 'Quantum Field Theory Notes',
    uploadedById: noteOwnerId,
    status: 'APPROVED'
  };

  await t.test('Author student should be authorized to manage own note', () => {
    assert.doesNotThrow(() => {
      assertNoteOwnership(mockNote, noteOwnerId, ROLES.STUDENT);
    });
  });

  await t.test('Non-owner student should be strictly rejected with 403', () => {
    assert.throws(
      () => {
        assertNoteOwnership(mockNote, otherUserId, ROLES.STUDENT);
      },
      (err) => {
        assert.equal(err.statusCode, 403);
        assert.equal(err.code, 'FORBIDDEN_OWNERSHIP');
        return true;
      }
    );
  });

  await t.test(
    'Moderator should not be granted direct content ownership over another scholar note',
    () => {
      assert.throws(
        () => {
          assertNoteOwnership(mockNote, otherUserId, ROLES.MODERATOR);
        },
        (err) => {
          assert.equal(err.statusCode, 403);
          return true;
        }
      );
    }
  );

  await t.test('Admin and Super Admin should have administrative override rights', () => {
    assert.doesNotThrow(() => {
      assertNoteOwnership(mockNote, otherUserId, ROLES.ADMIN);
    });
    assert.doesNotThrow(() => {
      assertNoteOwnership(mockNote, otherUserId, ROLES.SUPER_ADMIN);
    });
  });

  await t.test('Missing note record should throw 404', () => {
    assert.throws(
      () => {
        assertNoteOwnership(null, noteOwnerId, ROLES.STUDENT);
      },
      (err) => {
        assert.equal(err.statusCode, 404);
        return true;
      }
    );
  });
});

test('HTTP API RBAC Endpoint Protection & Invariants', async (t) => {
  let server;
  let baseUrl;

  // Setup test server
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

  // Seed / retrieve test users in MySQL
  let studentUser;
  let moderatorUser;
  let adminUser;
  let superAdminUser;
  let suspendedUser;

  // Ensure test users exist in DB
  studentUser = await prisma.user.upsert({
    where: { email: 'rbac_student@test.com' },
    update: { role: 'STUDENT', isActive: true },
    create: {
      name: 'RBAC Student',
      email: 'rbac_student@test.com',
      passwordHash: 'dummy_hash',
      role: 'STUDENT',
      isActive: true
    }
  });

  moderatorUser = await prisma.user.upsert({
    where: { email: 'rbac_mod@test.com' },
    update: { role: 'MODERATOR', isActive: true },
    create: {
      name: 'RBAC Moderator',
      email: 'rbac_mod@test.com',
      passwordHash: 'dummy_hash',
      role: 'MODERATOR',
      isActive: true
    }
  });

  adminUser = await prisma.user.upsert({
    where: { email: 'rbac_admin@test.com' },
    update: { role: 'ADMIN', isActive: true },
    create: {
      name: 'RBAC Admin',
      email: 'rbac_admin@test.com',
      passwordHash: 'dummy_hash',
      role: 'ADMIN',
      isActive: true
    }
  });

  superAdminUser = await prisma.user.upsert({
    where: { email: 'rbac_super@test.com' },
    update: { role: 'SUPER_ADMIN', isActive: true },
    create: {
      name: 'RBAC Super Admin',
      email: 'rbac_super@test.com',
      passwordHash: 'dummy_hash',
      role: 'SUPER_ADMIN',
      isActive: true
    }
  });

  suspendedUser = await prisma.user.upsert({
    where: { email: 'rbac_suspended@test.com' },
    update: { role: 'STUDENT', isActive: false },
    create: {
      name: 'RBAC Suspended Student',
      email: 'rbac_suspended@test.com',
      passwordHash: 'dummy_hash',
      role: 'STUDENT',
      isActive: false
    }
  });

  const studentToken = generateAccessToken(studentUser);
  const modToken = generateAccessToken(moderatorUser);
  const adminToken = generateAccessToken(adminUser);
  const superToken = generateAccessToken(superAdminUser);
  const suspendedToken = generateAccessToken(suspendedUser);

  await t.test('GET /api/v1/admin/users without token should return 401 UNAUTHORIZED', async () => {
    const res = await fetch(`${baseUrl}/api/v1/admin/users`);
    assert.equal(res.status, 401);
    const json = await res.json();
    assert.equal(json.error.code, 'UNAUTHORIZED');
  });

  await t.test(
    'GET /api/v1/admin/users with Student token should return 403 FORBIDDEN',
    async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/users`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.error.code, 'FORBIDDEN');
    }
  );

  await t.test(
    'GET /api/v1/admin/users with Moderator token should return 403 FORBIDDEN',
    async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/users`, {
        headers: { Authorization: `Bearer ${modToken}` }
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.error.code, 'FORBIDDEN');
    }
  );

  await t.test(
    'GET /api/v1/admin/users with Admin token should return 200 with user list',
    async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/users`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(Array.isArray(json.data.data));
      assert.ok(json.data.pagination);
    }
  );

  await t.test(
    'Suspended user calling protected API should be rejected with 403 ACCOUNT_SUSPENDED',
    async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/users`, {
        headers: { Authorization: `Bearer ${suspendedToken}` }
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.error.code, 'ACCOUNT_SUSPENDED');
    }
  );

  await t.test(
    'PATCH /api/v1/admin/users/:id/role - user cannot change their own role',
    async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/users/${adminUser.id}/role`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: 'SUPER_ADMIN' })
      });
      assert.equal(res.status, 400);
      const json = await res.json();
      assert.equal(json.error.code, 'CANNOT_MODIFY_OWN_ROLE');
    }
  );

  await t.test(
    'PATCH /api/v1/admin/users/:id/role - Admin cannot grant Super Admin role',
    async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/users/${studentUser.id}/role`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: 'SUPER_ADMIN' })
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.error.code, 'FORBIDDEN_ROLE_MANAGEMENT');
    }
  );

  await t.test(
    'PATCH /api/v1/admin/users/:id/role - Admin cannot modify another Admin',
    async () => {
      // Create secondary admin
      const secondaryAdmin = await prisma.user.upsert({
        where: { email: 'secondary_admin@test.com' },
        update: { role: 'ADMIN' },
        create: {
          name: 'Secondary Admin',
          email: 'secondary_admin@test.com',
          passwordHash: 'dummy',
          role: 'ADMIN',
          isActive: true
        }
      });

      const res = await fetch(`${baseUrl}/api/v1/admin/users/${secondaryAdmin.id}/role`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: 'STUDENT' })
      });
      assert.equal(res.status, 403);
      const json = await res.json();
      assert.equal(json.error.code, 'FORBIDDEN_ROLE_MANAGEMENT');
    }
  );

  await t.test('PATCH /api/v1/admin/users/:id/role - Reject invalid manipulated role', async () => {
    const res = await fetch(`${baseUrl}/api/v1/admin/users/${studentUser.id}/role`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${superToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: 'PRESIDENT_OF_UNIVERSE' })
    });
    assert.equal(res.status, 422);
  });

  await t.test(
    'Super Admin changing Student to Moderator should succeed and write audit log',
    async () => {
      const res = await fetch(`${baseUrl}/api/v1/admin/users/${studentUser.id}/role`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${superToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: 'MODERATOR', reason: 'Assigned as biology note reviewer' })
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.equal(json.success, true);
      assert.equal(json.data.role, 'MODERATOR');

      // Verify audit log entry was created
      const auditRecord = await prisma.auditLog.findFirst({
        where: {
          entityId: studentUser.id,
          action: 'USER_ROLE_CHANGED'
        },
        orderBy: { createdAt: 'desc' }
      });
      assert.ok(auditRecord);
      assert.equal(auditRecord.actorId, superAdminUser.id);
    }
  );

  await t.test('GET /api/v1/admin/audit-logs requires AUDIT_LOGS_READ permission', async () => {
    // Student rejected
    const studentRes = await fetch(`${baseUrl}/api/v1/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    assert.equal(studentRes.status, 403);

    // Admin allowed
    const adminRes = await fetch(`${baseUrl}/api/v1/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.equal(adminRes.status, 200);
    const adminJson = await adminRes.json();
    assert.ok(Array.isArray(adminJson.data.data));
  });
});
