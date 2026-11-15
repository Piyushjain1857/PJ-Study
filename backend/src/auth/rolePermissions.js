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
 * Final 3-tier Architecture: SCHOLAR (STUDENT), ADMIN (former Moderator), SUPER_ADMIN
 */
export const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.STUDENT]: Object.freeze([
    PERMISSIONS.NOTES_READ,
    PERMISSIONS.NOTES_DOWNLOAD
  ]),

  [ROLES.ADMIN]: Object.freeze([
    // Base scholar reader & downloader
    PERMISSIONS.NOTES_READ,
    PERMISSIONS.NOTES_DOWNLOAD,
    // Note authoring & management
    PERMISSIONS.NOTES_CREATE,
    PERMISSIONS.NOTES_UPDATE_OWN,
    PERMISSIONS.NOTES_DELETE_OWN,
    PERMISSIONS.NOTES_SUBMIT_REVIEW,
    // Moderation capabilities
    PERMISSIONS.NOTES_REVIEW,
    PERMISSIONS.NOTES_APPROVE,
    PERMISSIONS.NOTES_REJECT
  ]),

  // Legacy compatibility: MODERATOR maps to identical permissions as ADMIN
  [ROLES.MODERATOR]: Object.freeze([
    PERMISSIONS.NOTES_READ,
    PERMISSIONS.NOTES_DOWNLOAD,
    PERMISSIONS.NOTES_CREATE,
    PERMISSIONS.NOTES_UPDATE_OWN,
    PERMISSIONS.NOTES_DELETE_OWN,
    PERMISSIONS.NOTES_SUBMIT_REVIEW,
    PERMISSIONS.NOTES_REVIEW,
    PERMISSIONS.NOTES_APPROVE,
    PERMISSIONS.NOTES_REJECT
  ]),

  [ROLES.SUPER_ADMIN]: Object.freeze([
    // Full platform administrative control
    PERMISSIONS.NOTES_READ,
    PERMISSIONS.NOTES_DOWNLOAD,
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

  // In the 3-tier architecture, only Super Admin can assign roles.
  // Admins (former Moderators) and Scholars have no role management authority.
  return {
    allowed: false,
    reason: 'Only Super Administrators possess permission to modify user roles and permissions.'
  };
}
