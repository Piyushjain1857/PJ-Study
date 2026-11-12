/**
 * Centralized RBAC permission constants and role capabilities for PJ Study.
 */
export const PERMISSIONS = Object.freeze({
  // Notes
  NOTES_READ: 'notes:read',
  NOTES_CREATE: 'notes:create',
  NOTES_UPDATE_OWN: 'notes:update_own',
  NOTES_DELETE_OWN: 'notes:delete_own',
  NOTES_SUBMIT_REVIEW: 'notes:submit_review',
  NOTES_REVIEW: 'notes:review',
  NOTES_APPROVE: 'notes:approve',
  NOTES_REJECT: 'notes:reject',
  NOTES_MANAGE_ALL: 'notes:manage_all',

  // Categories & Taxonomy
  CATEGORIES_MANAGE: 'categories:manage',

  // User Management
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_CHANGE_ROLE: 'users:change_role',
  USERS_SUSPEND: 'users:suspend',

  // Elevated Staff Management
  MODERATORS_MANAGE: 'moderators:manage',
  ADMINS_MANAGE: 'admins:manage',

  // System & Compliance
  SETTINGS_MANAGE: 'settings:manage',
  AUDIT_LOGS_READ: 'audit_logs:read'
});

export const ROLES = Object.freeze({
  STUDENT: 'STUDENT',
  MODERATOR: 'MODERATOR',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN'
});

export const ROLE_PERMISSIONS = Object.freeze({
  [ROLES.STUDENT]: Object.freeze([
    PERMISSIONS.NOTES_READ,
    PERMISSIONS.NOTES_CREATE,
    PERMISSIONS.NOTES_UPDATE_OWN,
    PERMISSIONS.NOTES_DELETE_OWN,
    PERMISSIONS.NOTES_SUBMIT_REVIEW
  ]),

  [ROLES.MODERATOR]: Object.freeze([
    PERMISSIONS.NOTES_READ,
    PERMISSIONS.NOTES_CREATE,
    PERMISSIONS.NOTES_UPDATE_OWN,
    PERMISSIONS.NOTES_DELETE_OWN,
    PERMISSIONS.NOTES_SUBMIT_REVIEW,
    PERMISSIONS.NOTES_REVIEW,
    PERMISSIONS.NOTES_APPROVE,
    PERMISSIONS.NOTES_REJECT
  ]),

  [ROLES.ADMIN]: Object.freeze([
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
    PERMISSIONS.AUDIT_LOGS_READ
  ]),

  [ROLES.SUPER_ADMIN]: Object.freeze([
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
  return Boolean(permissions && permissions.includes(permission));
}

/**
 * Returns all permissions granted to a given role.
 *
 * @param {string} role
 * @returns {readonly string[]}
 */
export function getPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Evaluates whether an administrator can assign candidateRole to targetUser.
 *
 * @param {string} callerRole
 * @param {string} currentTargetRole
 * @param {string} candidateRole
 * @returns {boolean}
 */
export function canManageRole(callerRole, currentTargetRole, candidateRole) {
  if (callerRole === ROLES.SUPER_ADMIN) {
    return true;
  }
  if (callerRole === ROLES.ADMIN) {
    if (candidateRole === ROLES.SUPER_ADMIN || candidateRole === ROLES.ADMIN) {
      return false;
    }
    if (currentTargetRole === ROLES.SUPER_ADMIN || currentTargetRole === ROLES.ADMIN) {
      return false;
    }
    return true;
  }
  return false;
}
