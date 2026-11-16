import { Router } from 'express';
import platformConfigController from './platformConfig.controller.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { requireRole } from '../../auth/requireRole.js';
import { ROLES } from '../../auth/rolePermissions.js';

export const publicConfigRouter = Router();
export const adminConfigRouter = Router();

// =============================================================================
// PUBLIC & WORKSPACE DELIVERY ROUTES
// =============================================================================

// GET /api/v1/platform/config/public - Public delivery for anonymous visitors
publicConfigRouter.get('/public', platformConfigController.getPublicConfig);

// GET /api/v1/platform/config/workspace - Authenticated workspace delivery for scholars & admins
publicConfigRouter.get('/workspace', requireAuth, platformConfigController.getWorkspaceConfig);

// =============================================================================
// SUPER ADMIN COMMAND & CUSTOMIZATION CONTROL ROUTES
// =============================================================================

// Guard all administrative customization routes strictly with SUPER_ADMIN
adminConfigRouter.use(requireAuth, requireRole(ROLES.SUPER_ADMIN));

// --- PAGE CONFIGURATIONS & VISUAL BUILDER ---
adminConfigRouter.get('/pages', platformConfigController.getPageConfigs);
adminConfigRouter.get('/pages/:pageKey', platformConfigController.getPageConfig);
adminConfigRouter.patch('/pages/:pageKey', platformConfigController.updateDraftPageConfig);
adminConfigRouter.post('/pages/:pageKey/publish', platformConfigController.publishPageConfig);

// --- THEME & BRANDING STUDIO ---
adminConfigRouter.get('/themes', platformConfigController.getThemes);
adminConfigRouter.patch('/themes/:roleScope', platformConfigController.updateDraftTheme);
adminConfigRouter.post('/themes/:roleScope/publish', platformConfigController.publishTheme);
adminConfigRouter.post('/themes/:roleScope/reset', platformConfigController.resetTheme);

// --- NAVIGATION BUILDER ---
adminConfigRouter.get('/navigation', platformConfigController.getNavigation);
adminConfigRouter.patch('/navigation/:roleScope', platformConfigController.updateDraftNavigation);
adminConfigRouter.post('/navigation/:roleScope/publish', platformConfigController.publishNavigation);
adminConfigRouter.post('/navigation/:roleScope/reset', platformConfigController.resetNavigation);

// --- FEATURE CONTROL CENTER ---
adminConfigRouter.get('/features', platformConfigController.getFeatures);
adminConfigRouter.patch('/features/:key', platformConfigController.updateFeature);

// --- ADMIN PERMISSION SCOPES ---
adminConfigRouter.get('/permissions', platformConfigController.getAdminPermissions);
adminConfigRouter.patch('/permissions', platformConfigController.updateAdminPermissions);

// --- CMS CONTENT BLOCKS ---
adminConfigRouter.get('/content', platformConfigController.getContentBlocks);
adminConfigRouter.patch('/content/:key', platformConfigController.updateContentBlock);

// --- VERSION AUDIT TRAIL & ROLLBACK ---
adminConfigRouter.get('/history', platformConfigController.getVersionHistory);
adminConfigRouter.post('/restore/:versionId', platformConfigController.rollbackVersion);

export default {
  publicConfigRouter,
  adminConfigRouter
};
