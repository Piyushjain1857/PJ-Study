import platformConfigService from './platformConfig.service.js';

export class PlatformConfigController {
  constructor(service = platformConfigService) {
    this.service = service;
  }

  // --- PUBLIC & WORKSPACE DELIVERY ---
  getPublicConfig = async (req, res, next) => {
    try {
      const data = await this.service.getPublicConfig();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getWorkspaceConfig = async (req, res, next) => {
    try {
      const role = req.user?.role || 'STUDENT';
      const data = await this.service.getWorkspaceConfig(role);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  // --- PAGE CONFIGURATIONS ---
  getPageConfigs = async (req, res, next) => {
    try {
      const data = await this.service.getPageConfigs();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getPageConfig = async (req, res, next) => {
    try {
      const { pageKey } = req.params;
      const data = await this.service.getPageConfig(pageKey);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  updateDraftPageConfig = async (req, res, next) => {
    try {
      const { pageKey } = req.params;
      const { draftConfig } = req.body;
      const data = await this.service.updateDraftPageConfig(pageKey, draftConfig, req.user);
      res.status(200).json({
        success: true,
        data,
        message: `Draft configuration for "${pageKey}" saved successfully.`
      });
    } catch (err) {
      next(err);
    }
  };

  publishPageConfig = async (req, res, next) => {
    try {
      const { pageKey } = req.params;
      const { changeSummary } = req.body || {};
      const data = await this.service.publishPageConfig(pageKey, req.user, changeSummary);
      res.status(200).json({
        success: true,
        data,
        message: `Page configuration for "${pageKey}" (v${data.version}) published successfully.`
      });
    } catch (err) {
      next(err);
    }
  };

  // --- THEMES ---
  getThemes = async (req, res, next) => {
    try {
      const data = await this.service.getThemes();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  updateDraftTheme = async (req, res, next) => {
    try {
      const { roleScope } = req.params;
      const { draftConfig } = req.body;
      const data = await this.service.updateDraftTheme(roleScope, draftConfig, req.user);
      res.status(200).json({
        success: true,
        data,
        message: `Theme draft for "${roleScope}" saved successfully.`
      });
    } catch (err) {
      next(err);
    }
  };

  publishTheme = async (req, res, next) => {
    try {
      const { roleScope } = req.params;
      const { changeSummary } = req.body || {};
      const data = await this.service.publishTheme(roleScope, req.user, changeSummary);
      res.status(200).json({
        success: true,
        data,
        message: `Theme for "${roleScope}" (v${data.version}) published successfully.`
      });
    } catch (err) {
      next(err);
    }
  };

  resetTheme = async (req, res, next) => {
    try {
      const { roleScope } = req.params;
      const data = await this.service.resetTheme(roleScope, req.user);
      res.status(200).json({
        success: true,
        data,
        message: `Theme for "${roleScope}" reset to system defaults.`
      });
    } catch (err) {
      next(err);
    }
  };

  // --- NAVIGATION ---
  getNavigation = async (req, res, next) => {
    try {
      const data = await this.service.getNavigation();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  updateDraftNavigation = async (req, res, next) => {
    try {
      const { roleScope } = req.params;
      const { draftConfig } = req.body;
      const data = await this.service.updateDraftNavigation(roleScope, draftConfig, req.user);
      res.status(200).json({
        success: true,
        data,
        message: `Navigation draft for "${roleScope}" saved successfully.`
      });
    } catch (err) {
      next(err);
    }
  };

  publishNavigation = async (req, res, next) => {
    try {
      const { roleScope } = req.params;
      const { changeSummary } = req.body || {};
      const data = await this.service.publishNavigation(roleScope, req.user, changeSummary);
      res.status(200).json({
        success: true,
        data,
        message: `Navigation for "${roleScope}" (v${data.version}) published successfully.`
      });
    } catch (err) {
      next(err);
    }
  };

  resetNavigation = async (req, res, next) => {
    try {
      const { roleScope } = req.params;
      const data = await this.service.resetNavigation(roleScope, req.user);
      res.status(200).json({
        success: true,
        data,
        message: `Navigation for "${roleScope}" reset to defaults.`
      });
    } catch (err) {
      next(err);
    }
  };

  // --- FEATURES ---
  getFeatures = async (req, res, next) => {
    try {
      const data = await this.service.getFeatures();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  updateFeature = async (req, res, next) => {
    try {
      const { key } = req.params;
      const { isEnabled, metadata } = req.body;
      const data = await this.service.updateFeature(key, isEnabled, metadata, req.user);
      res.status(200).json({
        success: true,
        data,
        message: `Feature flag "${key}" updated successfully.`
      });
    } catch (err) {
      next(err);
    }
  };

  // --- ADMIN PERMISSIONS ---
  getAdminPermissions = async (req, res, next) => {
    try {
      const data = await this.service.getAdminPermissions();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  updateAdminPermissions = async (req, res, next) => {
    try {
      const { scopes } = req.body;
      const data = await this.service.updateAdminPermissions(scopes, req.user);
      res.status(200).json({
        success: true,
        data,
        message: 'Admin permission scopes updated successfully.'
      });
    } catch (err) {
      next(err);
    }
  };

  // --- CONTENT BLOCKS ---
  getContentBlocks = async (req, res, next) => {
    try {
      const data = await this.service.getContentBlocks();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  updateContentBlock = async (req, res, next) => {
    try {
      const { key } = req.params;
      const data = await this.service.updateContentBlock(key, req.body, req.user);
      res.status(200).json({
        success: true,
        data,
        message: `Content block "${key}" updated successfully.`
      });
    } catch (err) {
      next(err);
    }
  };

  // --- VERSION HISTORY & ROLLBACK ---
  getVersionHistory = async (req, res, next) => {
    try {
      const { limit } = req.query;
      const data = await this.service.getVersionHistory(limit);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  rollbackVersion = async (req, res, next) => {
    try {
      const { versionId } = req.params;
      const result = await this.service.rollbackVersion(versionId, req.user);
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  };
}

export const platformConfigController = new PlatformConfigController();
export default platformConfigController;
