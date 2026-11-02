import { PERMISSIONS } from './permissions.js';

/**
 * Valid system roles.
 */
export const ROLES = Object.freeze({
  STUDENT: 'STUDENT',
  MODERATOR: 'MODERATOR',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN'
});

/**
 * Centralized Role-to-Permissions Mapping.
 */
export const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.STUDENT]: Object.freeze([
    PERMISSIONS.NOTES_READ,
    PERMISSIONS.NOTES_CREATE,
    PERMISSIONS.NOTES_UPDATE_OWN,
    PERMISSIONS.NOTES_DELETE_OWN,
    PERMISSIONS.NOTES_SUBMIT_REVIEW
  ]),

  [ROLES.MODERATOR]: Object.freeze([
    // Student base capabilities
    PERMISSIONS.NOTES_READ,
    PERMISSIONS.NOTES_CREATE,
    PERMISSIONS.NOTES_UPDATE_OWN,
    PERMISSIONS.NOTES_DELETE_OWN,
    PERMISSIONS.NOTES_SUBMIT_REVIEW,
    // Moderation capabilities
    PERMISSIONS.NOTES_REVIEW,
    PERMISSIONS.NOTES_APPROVE,
    PERMISSIONS.NOTES_REJECT
  ]),

  [ROLES.ADMIN]: Object.freeze([
    // Moderator base capabilities
    PERMISSIONS.NOTES_READ,
    PERMISSIONS.NOTES_CREATE,
    PERMISSIONS.NOTES_UPDATE_OWN,
    PERMISSIONS.NOTES_DELETE_OWN,
    PERMISSIONS.NOTES_SUBMIT_REVIEW,
    PERMISSIONS.NOTES_REVIEW,
    PERMISSIONS.NOTES_APPROVE,
    PERMISSIONS.NOTES_REJECT,
    PERMISSIONS.NOTES_MANAGE_ALL,
    // Academic Administration
    PERMISSIONS.CATEGORIES_MANAGE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_SUSPEND,
    PERMISSIONS.USERS_CHANGE_ROLE, // Limited in service: student <-> moderator only
    PERMISSIONS.AUDIT_LOGS_READ
  ]),

  [ROLES.SUPER_ADMIN]: Object.freeze([
    // All Admin capabilities
    PERMISSIONS.NOTES_READ,
    PERMISSIONS.NOTES_CREATE,
    PERMISSIONS.NOTES_UPDATE_OWN,
    PERMISSIONS.NOTES_DELETE_OWN,
    PERMISSIONS.NOTES_SUBMIT_REVIEW,
    PERMISSIONS.NOTES_REVIEW,
    PERMISSIONS.NOTES_APPROVE,
    PERMISSIONS.NOTES_REJECT,
    PERMISSIONS.NOTES_MANAGE_ALL,
    PERMISSIONS.CATEGORIES_MANAGE,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_SUSPEND,
    PERMISSIONS.USERS_CHANGE_ROLE,
    PERMISSIONS.AUDIT_LOGS_READ,
    // Exclusive Super Admin capabilities
    PERMISSIONS.MODERATORS_MANAGE,
    PERMISSIONS.ADMINS_MANAGE,
    PERMISSIONS.SETTINGS_MANAGE
  ])
});

/**
 * Checks whether a given role holds a specific permission.
 *
 * @param {string} role
 * @param {string} permission
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  if (!role || !permission) return false;
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

/**
 * Returns all permissions associated with a given role.
 *
 * @param {string} role
 * @returns {readonly string[]}
 */
export function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Evaluates whether an administrative caller has the authority to transition
 * a target user from their current role to a requested new role.
 *
 * @param {string} callerRole - Role of the requesting actor
 * @param {string} currentTargetRole - Current role of target user
 * @param {string} requestedNewRole - Target role to be assigned
 * @returns {{ allowed: boolean, reason?: string }}
 */
export function canRoleManageTarget(callerRole, currentTargetRole, requestedNewRole) {
  if (callerRole === ROLES.SUPER_ADMIN) {
    // Super Admin can assign any role (subject to last-super-admin invariant checked in service)
    return { allowed: true };
  }

  if (callerRole === ROLES.ADMIN) {
    // Admin cannot assign Super Admin role
    if (requestedNewRole === ROLES.SUPER_ADMIN) {
      return {
        allowed: false,
        reason:
          'Administrators cannot grant the Super Admin role. Only Super Admins can assign this role.'
      };
    }

    // Admin cannot promote a user to Admin (managing admins requires SUPER_ADMIN)
    if (requestedNewRole === ROLES.ADMIN) {
      return {
        allowed: false,
        reason:
          'Administrators cannot assign the Admin role. Only Super Admins can manage administrators.'
      };
    }

    // Admin cannot modify an existing Admin or Super Admin
    if (currentTargetRole === ROLES.SUPER_ADMIN || currentTargetRole === ROLES.ADMIN) {
      return {
        allowed: false,
        reason:
          'Administrators do not have permission to modify another Administrator or Super Administrator.'
      };
    }

    // Admin can transition users between STUDENT and MODERATOR
    if (
      (currentTargetRole === ROLES.STUDENT || currentTargetRole === ROLES.MODERATOR) &&
      (requestedNewRole === ROLES.STUDENT || requestedNewRole === ROLES.MODERATOR)
    ) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'Administrators can only modify roles between Student and Moderator.'
    };
  }

  // Moderators and Students have no role management authority
  return {
    allowed: false,
    reason: 'Insufficient permissions: role management requires administrative privileges.'
  };
}
