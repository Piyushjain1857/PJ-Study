import apiClient from './api.js';

let cachedPublicConfig = null;
let publicConfigTimestamp = 0;
let inFlightPublicConfigPromise = null;
const CONFIG_CACHE_TTL_MS = 60000; // 60 seconds

export function invalidateClientPublicConfig() {
  cachedPublicConfig = null;
  publicConfigTimestamp = 0;
}

/**
 * Platform Configuration & Customization Service (Step 20)
 * Connects frontend to the Platform Owner Command Center backend APIs.
 */
export const platformConfigService = {
  // Public & Workspace Delivery
  async getPublicConfig(options = { forceFresh: false }) {
    const now = Date.now();
    if (!options.forceFresh && cachedPublicConfig && now - publicConfigTimestamp < CONFIG_CACHE_TTL_MS) {
      return cachedPublicConfig;
    }

    if (!options.forceFresh && inFlightPublicConfigPromise) {
      return inFlightPublicConfigPromise;
    }

    inFlightPublicConfigPromise = apiClient
      .get('/platform/config/public')
      .then((res) => {
        cachedPublicConfig = res.data?.data;
        publicConfigTimestamp = Date.now();
        return cachedPublicConfig;
      })
      .finally(() => {
        inFlightPublicConfigPromise = null;
      });

    return inFlightPublicConfigPromise;
  },

  async getWorkspaceConfig() {
    const res = await apiClient.get('/platform/config/workspace');
    return res.data?.data;
  },

  // Page Configurations & Visual Builder
  async getPageConfigs() {
    const res = await apiClient.get('/admin/config/pages');
    return res.data?.data;
  },

  async getPageConfig(pageKey) {
    const res = await apiClient.get(`/admin/config/pages/${pageKey}`);
    return res.data?.data;
  },

  async updateDraftPage(pageKey, draftConfig) {
    const res = await apiClient.patch(`/admin/config/pages/${pageKey}`, { draftConfig });
    return res.data?.data;
  },

  async publishPage(pageKey, changeSummary = '') {
    const res = await apiClient.post(`/admin/config/pages/${pageKey}/publish`, { changeSummary });
    return res.data?.data;
  },

  // Theme & Branding Studio
  async getThemes() {
    const res = await apiClient.get('/admin/config/themes');
    return res.data?.data;
  },

  async updateDraftTheme(roleScope, draftConfig) {
    const res = await apiClient.patch(`/admin/config/themes/${roleScope}`, { draftConfig });
    return res.data?.data;
  },

  async publishTheme(roleScope, changeSummary = '') {
    const res = await apiClient.post(`/admin/config/themes/${roleScope}/publish`, { changeSummary });
    return res.data?.data;
  },

  async resetTheme(roleScope) {
    const res = await apiClient.post(`/admin/config/themes/${roleScope}/reset`);
    return res.data?.data;
  },

  // Navigation Builder
  async getNavigation() {
    const res = await apiClient.get('/admin/config/navigation');
    return res.data?.data;
  },

  async updateDraftNavigation(roleScope, draftConfig) {
    const res = await apiClient.patch(`/admin/config/navigation/${roleScope}`, { draftConfig });
    return res.data?.data;
  },

  async publishNavigation(roleScope, changeSummary = '') {
    const res = await apiClient.post(`/admin/config/navigation/${roleScope}/publish`, { changeSummary });
    return res.data?.data;
  },

  async resetNavigation(roleScope) {
    const res = await apiClient.post(`/admin/config/navigation/${roleScope}/reset`);
    return res.data?.data;
  },

  // Feature Control Center
  async getFeatures() {
    const res = await apiClient.get('/admin/config/features');
    return res.data?.data;
  },

  async updateFeature(key, isEnabled, metadata) {
    const res = await apiClient.patch(`/admin/config/features/${key}`, { isEnabled, metadata });
    return res.data?.data;
  },

  // Admin Permission Scopes
  async getAdminPermissions() {
    const res = await apiClient.get('/admin/config/permissions');
    return res.data?.data;
  },

  async updateAdminPermissions(scopes) {
    const res = await apiClient.patch('/admin/config/permissions', { scopes });
    return res.data?.data;
  },

  // Content Blocks (CMS)
  async getContentBlocks() {
    const res = await apiClient.get('/admin/config/content');
    return res.data?.data;
  },

  async updateContentBlock(key, blockData) {
    const res = await apiClient.patch(`/admin/config/content/${key}`, blockData);
    return res.data?.data;
  },

  // Version History & Rollback
  async getVersionHistory(entityType = '') {
    const url = entityType ? `/admin/config/history?entityType=${entityType}` : '/admin/config/history';
    const res = await apiClient.get(url);
    return res.data?.data;
  },

  async rollbackVersion(versionId) {
    const res = await apiClient.post(`/admin/config/restore/${versionId}`);
    return res.data?.data;
  }
};

export default platformConfigService;
