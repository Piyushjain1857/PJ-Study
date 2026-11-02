/**
 * Centralized stable permission identifiers for PJ Study platform.
 */
export const PERMISSIONS = Object.freeze({
  // Notes & Study Materials
  NOTES_READ: 'notes:read',
  NOTES_CREATE: 'notes:create',
  NOTES_UPDATE_OWN: 'notes:update_own',
  NOTES_DELETE_OWN: 'notes:delete_own',
  NOTES_SUBMIT_REVIEW: 'notes:submit_review',
  NOTES_REVIEW: 'notes:review',
  NOTES_APPROVE: 'notes:approve',
  NOTES_REJECT: 'notes:reject',
  NOTES_MANAGE_ALL: 'notes:manage_all',

  // Categories & Academic Taxonomy
  CATEGORIES_MANAGE: 'categories:manage',

  // User Management
  USERS_READ: 'users:read',
  USERS_UPDATE: 'users:update',
  USERS_CHANGE_ROLE: 'users:change_role',
  USERS_SUSPEND: 'users:suspend',

  // Administrative Role Elevation
  MODERATORS_MANAGE: 'moderators:manage',
  ADMINS_MANAGE: 'admins:manage',

  // System Settings & Compliance
  SETTINGS_MANAGE: 'settings:manage',
  AUDIT_LOGS_READ: 'audit_logs:read'
});

export default PERMISSIONS;

