import prisma from '../../config/database.js';
import auditService from '../audit/audit.service.js';
import {
  validatePageConfiguration,
  validateThemeConfiguration,
  sanitizeString
} from './componentRegistry.js';
import {
  DEFAULT_PAGE_CONFIGS,
  DEFAULT_THEMES,
  DEFAULT_NAVIGATION,
  DEFAULT_FEATURE_FLAGS,
  DEFAULT_ADMIN_PERMISSION_SCOPES
} from './defaultConfigs.js';

export class PlatformConfigService {
  constructor(auditSvc = auditService) {
    this.auditSvc = auditSvc;
  }

  /**
   * Initializes database with default configuration records if absent.
   */
  async initDefaultConfigurations() {
    // 1. Seed Page Configurations
    const PAGE_TITLES = {
      homepage: 'Public Landing Page',
      scholar_dashboard: 'Scholar Dashboard',
      scholar_explore: 'Explore Notes Page',
      scholar_recommended: 'Personalized Recommendations',
      scholar_library: 'My Study Library',
      scholar_profile: 'Scholar Profile & Credentials',
      scholar_notifications: 'Notification Center',
      admin_dashboard: 'Admin Operations Dashboard',
      admin_upload: 'Direct Note Upload',
      admin_notes: 'Curriculum Notes Inventory'
    };

    for (const [pageKey, config] of Object.entries(DEFAULT_PAGE_CONFIGS)) {
      const existing = await prisma.pageConfiguration.findUnique({ where: { pageKey } });
      if (!existing) {
        await prisma.pageConfiguration.create({
          data: {
            pageKey,
            title: PAGE_TITLES[pageKey] || pageKey.replace(/_/g, ' ').toUpperCase(),
            draftConfig: config,
            publishedConfig: config,
            version: 1
          }
        });
      }
    }

    // 2. Seed Platform Themes
    for (const [roleScope, theme] of Object.entries(DEFAULT_THEMES)) {
      const existing = await prisma.platformTheme.findUnique({ where: { roleScope } });
      if (!existing) {
        await prisma.platformTheme.create({
          data: {
            roleScope,
            name: `${roleScope} Visual Theme`,
            draftConfig: theme,
            publishedConfig: theme,
            version: 1
          }
        });
      }
    }

    // 3. Seed Navigation Configurations
    for (const [roleScope, nav] of Object.entries(DEFAULT_NAVIGATION)) {
      const existing = await prisma.navigationConfiguration.findUnique({ where: { roleScope } });
      if (!existing) {
        await prisma.navigationConfiguration.create({
          data: {
            roleScope,
            draftConfig: nav,
            publishedConfig: nav,
            version: 1
          }
        });
      }
    }

    // 4. Seed Feature Flags
    for (const flag of DEFAULT_FEATURE_FLAGS) {
      const existing = await prisma.featureFlag.findUnique({ where: { key: flag.key } });
      if (!existing) {
        await prisma.featureFlag.create({
          data: {
            key: flag.key,
            name: flag.name,
            description: flag.description,
            category: flag.category,
            isEnabled: flag.isEnabled
          }
        });
      }
    }

    // 5. Seed Content Blocks
    const defaultBlocks = [
      {
        key: 'faq_general',
        section: 'homepage',
        title: 'Frequently Asked Questions',
        content: [
          {
            q: 'How does PJ Study map academic curriculums?',
            a: 'All lecture notes and past year questions are mapped strictly by university faculty, degree course, and active semester syllabus.'
          },
          {
            q: 'Can students upload study notes?',
            a: 'To guarantee quality, authenticity, and academic rigor, only verified university administrators author and publish official manuscripts.'
          },
          {
            q: 'Are peer reviews from real students?',
            a: 'Yes, only authenticated scholars registered in the university directory can post qualitative reviews and helpfulness votes.'
          }
        ]
      },
      {
        key: 'academic_notice',
        section: 'dashboard',
        title: 'Campus Examination Notice',
        content: {
          banner: 'Official examination revision materials are published under K.R. Mangalam University curriculum.',
          contactEmail: 'academics@krmangalam.edu.in'
        }
      }
    ];

    for (const block of defaultBlocks) {
      const existing = await prisma.contentBlock.findUnique({ where: { key: block.key } });
      if (!existing) {
        await prisma.contentBlock.create({
          data: {
            key: block.key,
            section: block.section,
            title: block.title,
            content: block.content,
            isPublished: true,
            version: 1
          }
        });
      }
    }
  }

  /**
   * --- PUBLIC CONFIGURATION ---
   */
  async getPublicConfig() {
    await this.initDefaultConfigurations();

    const [themeRec, pageRec, features, content] = await Promise.all([
      prisma.platformTheme.findUnique({ where: { roleScope: 'PUBLIC' } }),
      prisma.pageConfiguration.findUnique({ where: { pageKey: 'homepage' } }),
      prisma.featureFlag.findMany({ select: { key: true, isEnabled: true, category: true } }),
      prisma.contentBlock.findMany({ where: { isPublished: true } })
    ]);

    const featureMap = {};
    for (const f of features) {
      featureMap[f.key] = f.isEnabled;
    }

    const contentMap = {};
    for (const c of content) {
      contentMap[c.key] = c.content;
    }

    return {
      theme: themeRec?.publishedConfig || DEFAULT_THEMES.PUBLIC,
      homepage: pageRec?.publishedConfig || DEFAULT_PAGE_CONFIGS.homepage,
      features: featureMap,
      content: contentMap
    };
  }

  /**
   * --- WORKSPACE CONFIGURATION (ROLE-SCOPED) ---
   */
  async getWorkspaceConfig(role = 'STUDENT') {
    await this.initDefaultConfigurations();

    const roleScope =
      role === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : role === 'ADMIN' || role === 'MODERATOR' ? 'ADMIN' : 'SCHOLAR';

    const pageKey = roleScope === 'ADMIN' ? 'admin_dashboard' : 'scholar_dashboard';

    const [themeRec, navRec, pageRec, features, content] = await Promise.all([
      prisma.platformTheme.findUnique({ where: { roleScope } }),
      prisma.navigationConfiguration.findUnique({ where: { roleScope } }),
      prisma.pageConfiguration.findUnique({ where: { pageKey } }),
      prisma.featureFlag.findMany({ select: { key: true, isEnabled: true, category: true } }),
      prisma.contentBlock.findMany({ where: { isPublished: true } })
    ]);

    const featureMap = {};
    for (const f of features) {
      featureMap[f.key] = f.isEnabled;
    }

    const contentMap = {};
    for (const c of content) {
      contentMap[c.key] = c.content;
    }

    return {
      roleScope,
      theme: themeRec?.publishedConfig || DEFAULT_THEMES[roleScope],
      navigation: navRec?.publishedConfig || DEFAULT_NAVIGATION[roleScope],
      pageConfig: pageRec?.publishedConfig || DEFAULT_PAGE_CONFIGS[pageKey],
      features: featureMap,
      content: contentMap
    };
  }

  /**
   * --- PAGE CONFIGURATIONS (SUPER ADMIN) ---
   */
  async getPageConfigs() {
    await this.initDefaultConfigurations();
    return prisma.pageConfiguration.findMany({
      orderBy: { pageKey: 'asc' }
    });
  }

  async getPageConfig(pageKey) {
    await this.initDefaultConfigurations();
    const config = await prisma.pageConfiguration.findUnique({ where: { pageKey } });
    if (!config) {
      const err = new Error(`Page configuration "${pageKey}" not found.`);
      err.statusCode = 404;
      throw err;
    }
    return config;
  }

  async updateDraftPageConfig(pageKey, draftConfig, actor) {
    validatePageConfiguration(pageKey, draftConfig);

    const existing = await this.getPageConfig(pageKey);

    const updated = await prisma.pageConfiguration.update({
      where: { pageKey },
      data: {
        draftConfig,
        updatedById: actor?.id
      }
    });

    await this.auditSvc.log({
      actorId: actor?.id,
      action: 'PAGE_DRAFT_UPDATED',
      entityType: 'PAGE_CONFIG',
      entityId: existing.id,
      metadata: { pageKey }
    });

    return updated;
  }

  async publishPageConfig(pageKey, actor, changeSummary = 'Published latest page layout') {
    const existing = await this.getPageConfig(pageKey);

    validatePageConfiguration(pageKey, existing.draftConfig);

    const newVersion = existing.version + 1;

    // Snapshot in ConfigurationVersion table for rollback
    await prisma.configurationVersion.create({
      data: {
        entityType: 'PAGE',
        entityKey: pageKey,
        version: newVersion,
        snapshot: existing.draftConfig,
        changeSummary: sanitizeString(changeSummary, 'Change summary'),
        createdById: actor?.id
      }
    });

    const updated = await prisma.pageConfiguration.update({
      where: { pageKey },
      data: {
        publishedConfig: existing.draftConfig,
        version: newVersion,
        updatedById: actor?.id
      }
    });

    await this.auditSvc.log({
      actorId: actor?.id,
      action: 'PAGE_CONFIG_PUBLISHED',
      entityType: 'PAGE_CONFIG',
      entityId: existing.id,
      metadata: { pageKey, version: newVersion, changeSummary }
    });

    return updated;
  }

  /**
   * --- THEMES (SUPER ADMIN) ---
   */
  async getThemes() {
    await this.initDefaultConfigurations();
    return prisma.platformTheme.findMany({
      orderBy: { roleScope: 'asc' }
    });
  }

  async updateDraftTheme(roleScope, draftConfig, actor) {
    validateThemeConfiguration(draftConfig);

    const existing = await prisma.platformTheme.findUnique({ where: { roleScope } });
    if (!existing) {
      const err = new Error(`Theme for scope "${roleScope}" not found.`);
      err.statusCode = 404;
      throw err;
    }

    const updated = await prisma.platformTheme.update({
      where: { roleScope },
      data: {
        draftConfig,
        updatedById: actor?.id
      }
    });

    await this.auditSvc.log({
      actorId: actor?.id,
      action: 'THEME_DRAFT_UPDATED',
      entityType: 'PLATFORM_THEME',
      entityId: existing.id,
      metadata: { roleScope }
    });

    return updated;
  }

  async publishTheme(roleScope, actor, changeSummary = 'Theme updated and published') {
    const existing = await prisma.platformTheme.findUnique({ where: { roleScope } });
    if (!existing) {
      const err = new Error(`Theme for scope "${roleScope}" not found.`);
      err.statusCode = 404;
      throw err;
    }

    validateThemeConfiguration(existing.draftConfig);

    const newVersion = existing.version + 1;

    await prisma.configurationVersion.create({
      data: {
        entityType: 'THEME',
        entityKey: roleScope,
        version: newVersion,
        snapshot: existing.draftConfig,
        changeSummary: sanitizeString(changeSummary, 'Change summary'),
        createdById: actor?.id
      }
    });

    const updated = await prisma.platformTheme.update({
      where: { roleScope },
      data: {
        publishedConfig: existing.draftConfig,
        version: newVersion,
        updatedById: actor?.id
      }
    });

    await this.auditSvc.log({
      actorId: actor?.id,
      action: 'THEME_PUBLISHED',
      entityType: 'PLATFORM_THEME',
      entityId: existing.id,
      metadata: { roleScope, version: newVersion }
    });

    return updated;
  }

  async resetTheme(roleScope, actor) {
    const defaultTheme = DEFAULT_THEMES[roleScope];
    if (!defaultTheme) {
      const err = new Error(`No default theme defined for scope "${roleScope}".`);
      err.statusCode = 400;
      throw err;
    }

    const existing = await prisma.platformTheme.findUnique({ where: { roleScope } });
    const newVersion = (existing?.version || 1) + 1;

    const updated = await prisma.platformTheme.upsert({
      where: { roleScope },
      update: {
        draftConfig: defaultTheme,
        publishedConfig: defaultTheme,
        version: newVersion,
        updatedById: actor?.id
      },
      create: {
        roleScope,
        name: `${roleScope} Visual Theme`,
        draftConfig: defaultTheme,
        publishedConfig: defaultTheme,
        version: 1,
        updatedById: actor?.id
      }
    });

    await this.auditSvc.log({
      actorId: actor?.id,
      action: 'THEME_RESET',
      entityType: 'PLATFORM_THEME',
      entityId: updated.id,
      metadata: { roleScope }
    });

    return updated;
  }

  /**
   * --- NAVIGATION (SUPER ADMIN) ---
   */
  async getNavigation() {
    await this.initDefaultConfigurations();
    return prisma.navigationConfiguration.findMany({
      orderBy: { roleScope: 'asc' }
    });
  }

  async updateDraftNavigation(roleScope, draftConfig, actor) {
    if (!Array.isArray(draftConfig)) {
      const err = new Error('Navigation draftConfig must be an array of navigation groups.');
      err.statusCode = 422;
      throw err;
    }

    for (const group of draftConfig) {
      if (group.label) sanitizeString(group.label, 'Group label');
      if (Array.isArray(group.items)) {
        for (const item of group.items) {
          if (item.label) sanitizeString(item.label, 'Item label');
          if (item.to) {
            sanitizeString(item.to, 'Item destination');
            // Hard safety boundary: block dangerous protocol URLs
            if (item.to.includes(':') && !item.to.startsWith('https://')) {
              throw new Error('Navigation destinations must be relative paths or secure HTTPS links.');
            }
          }
        }
      }
    }

    const existing = await prisma.navigationConfiguration.findUnique({ where: { roleScope } });
    if (!existing) {
      const err = new Error(`Navigation config for role "${roleScope}" not found.`);
      err.statusCode = 404;
      throw err;
    }

    const updated = await prisma.navigationConfiguration.update({
      where: { roleScope },
      data: {
        draftConfig,
        updatedById: actor?.id
      }
    });

    await this.auditSvc.log({
      actorId: actor?.id,
      action: 'NAVIGATION_DRAFT_UPDATED',
      entityType: 'NAVIGATION_CONFIG',
      entityId: existing.id,
      metadata: { roleScope }
    });

    return updated;
  }

  async publishNavigation(roleScope, actor, changeSummary = 'Navigation menu updated') {
    const existing = await prisma.navigationConfiguration.findUnique({ where: { roleScope } });
    if (!existing) {
      const err = new Error(`Navigation config for role "${roleScope}" not found.`);
      err.statusCode = 404;
      throw err;
    }

    const newVersion = existing.version + 1;

    await prisma.configurationVersion.create({
      data: {
        entityType: 'NAVIGATION',
        entityKey: roleScope,
        version: newVersion,
        snapshot: existing.draftConfig,
        changeSummary: sanitizeString(changeSummary, 'Change summary'),
        createdById: actor?.id
      }
    });

    const updated = await prisma.navigationConfiguration.update({
      where: { roleScope },
      data: {
        publishedConfig: existing.draftConfig,
        version: newVersion,
        updatedById: actor?.id
      }
    });

    await this.auditSvc.log({
      actorId: actor?.id,
      action: 'NAVIGATION_PUBLISHED',
      entityType: 'NAVIGATION_CONFIG',
      entityId: existing.id,
      metadata: { roleScope, version: newVersion }
    });

    return updated;
  }

  async resetNavigation(roleScope, actor) {
    const defaultNav = DEFAULT_NAVIGATION[roleScope];
    if (!defaultNav) {
      const err = new Error(`No default navigation defined for role "${roleScope}".`);
      err.statusCode = 400;
      throw err;
    }

    const existing = await prisma.navigationConfiguration.findUnique({ where: { roleScope } });
    const newVersion = (existing?.version || 1) + 1;

    const updated = await prisma.navigationConfiguration.upsert({
      where: { roleScope },
      update: {
        draftConfig: defaultNav,
        publishedConfig: defaultNav,
        version: newVersion,
        updatedById: actor?.id
      },
      create: {
        roleScope,
        draftConfig: defaultNav,
        publishedConfig: defaultNav,
        version: 1,
        updatedById: actor?.id
      }
    });

    await this.auditSvc.log({
      actorId: actor?.id,
      action: 'NAVIGATION_RESET',
      entityType: 'NAVIGATION_CONFIG',
      entityId: updated.id,
      metadata: { roleScope }
    });

    return updated;
  }

  /**
   * --- FEATURE FLAGS (SUPER ADMIN) ---
   */
  async getFeatures() {
    await this.initDefaultConfigurations();
    return prisma.featureFlag.findMany({
      orderBy: { category: 'asc' }
    });
  }

  async updateFeature(key, isEnabled, metadata, actor) {
    const existing = await prisma.featureFlag.findUnique({ where: { key } });
    if (!existing) {
      const err = new Error(`Feature flag "${key}" not found.`);
      err.statusCode = 404;
      throw err;
    }

    const updateData = {};
    if (isEnabled !== undefined) updateData.isEnabled = Boolean(isEnabled);
    if (metadata !== undefined) updateData.metadata = metadata;
    updateData.updatedById = actor?.id;

    const updated = await prisma.featureFlag.update({
      where: { key },
      data: updateData
    });

    await this.auditSvc.log({
      actorId: actor?.id,
      action: 'FEATURE_FLAG_UPDATED',
      entityType: 'FEATURE_FLAG',
      entityId: updated.id,
      metadata: { key, isEnabled: updated.isEnabled }
    });

    return updated;
  }

  /**
   * --- ADMIN PERMISSIONS SCOPING (SUPER ADMIN) ---
   */
  async getAdminPermissions() {
    // Fetch custom setting or fallback to default
    const setting = await prisma.platformSetting.findUnique({
      where: { key: 'ADMIN_ROLE_SCOPES' }
    });

    if (setting?.value) {
      try {
        return JSON.parse(setting.value);
      } catch {
        return DEFAULT_ADMIN_PERMISSION_SCOPES;
      }
    }

    return DEFAULT_ADMIN_PERMISSION_SCOPES;
  }

  async updateAdminPermissions(scopes, actor) {
    if (!Array.isArray(scopes)) {
      const err = new Error('Scopes must be an array of permission scope objects.');
      err.statusCode = 422;
      throw err;
    }

    // Hard RBAC Safety Check:
    // Super Admin cannot grant dangerous permissions (e.g. users:change_role, settings:manage, moderators:manage) to Admin
    const FORBIDDEN_ADMIN_PERMISSIONS = [
      'users:change_role',
      'settings:manage',
      'moderators:manage',
      'admins:manage',
      'audit_logs:read'
    ];

    for (const scope of scopes) {
      if (FORBIDDEN_ADMIN_PERMISSIONS.includes(scope.id) && scope.isGranted) {
        const err = new Error(
          `Permission "${scope.id}" is restricted to Super Admin and cannot be delegated.`
        );
        err.statusCode = 403;
        throw err;
      }
    }

    const serialized = JSON.stringify(scopes);

    await prisma.platformSetting.upsert({
      where: { key: 'ADMIN_ROLE_SCOPES' },
      update: {
        value: serialized,
        updatedById: actor?.id
      },
      create: {
        key: 'ADMIN_ROLE_SCOPES',
        value: serialized,
        category: 'SECURITY',
        description: 'Super Admin managed permission scopes for the normal ADMIN role.',
        updatedById: actor?.id
      }
    });

    await this.auditSvc.log({
      actorId: actor?.id,
      action: 'ADMIN_PERMISSIONS_SCOPED',
      entityType: 'PLATFORM_SETTING',
      entityId: 'ADMIN_ROLE_SCOPES',
      metadata: { scopesCount: scopes.length }
    });

    return scopes;
  }

  /**
   * --- CONTENT BLOCKS (CMS) ---
   */
  async getContentBlocks() {
    await this.initDefaultConfigurations();
    return prisma.contentBlock.findMany({
      orderBy: { section: 'asc' }
    });
  }

  async updateContentBlock(key, data, actor) {
    const existing = await prisma.contentBlock.findUnique({ where: { key } });
    if (!existing) {
      const err = new Error(`Content block "${key}" not found.`);
      err.statusCode = 404;
      throw err;
    }

    const updateData = {};
    if (data.title) updateData.title = sanitizeString(data.title, 'Content block title');
    if (data.content !== undefined) updateData.content = data.content;
    if (data.isPublished !== undefined) updateData.isPublished = Boolean(data.isPublished);
    updateData.updatedById = actor?.id;

    const updated = await prisma.contentBlock.update({
      where: { key },
      data: updateData
    });

    await this.auditSvc.log({
      actorId: actor?.id,
      action: 'CONTENT_BLOCK_UPDATED',
      entityType: 'CONTENT_BLOCK',
      entityId: updated.id,
      metadata: { key }
    });

    return updated;
  }

  /**
   * --- VERSION HISTORY & ROLLBACK ---
   */
  async getVersionHistory(limit = 30) {
    return prisma.configurationVersion.findMany({
      take: Math.min(Number(limit) || 30, 100),
      orderBy: { createdAt: 'desc' }
    });
  }

  async rollbackVersion(versionId, actor) {
    const versionRecord = await prisma.configurationVersion.findUnique({
      where: { id: versionId }
    });

    if (!versionRecord) {
      const err = new Error('Configuration version record not found.');
      err.statusCode = 404;
      throw err;
    }

    const { entityType, entityKey, snapshot } = versionRecord;

    if (entityType === 'PAGE') {
      const page = await prisma.pageConfiguration.findUnique({ where: { pageKey: entityKey } });
      if (!page) throw new Error(`Target page "${entityKey}" not found.`);
      const newVersion = page.version + 1;

      await prisma.pageConfiguration.update({
        where: { pageKey: entityKey },
        data: {
          draftConfig: snapshot,
          publishedConfig: snapshot,
          version: newVersion,
          updatedById: actor?.id
        }
      });
    } else if (entityType === 'THEME') {
      const theme = await prisma.platformTheme.findUnique({ where: { roleScope: entityKey } });
      if (!theme) throw new Error(`Target theme "${entityKey}" not found.`);
      const newVersion = theme.version + 1;

      await prisma.platformTheme.update({
        where: { roleScope: entityKey },
        data: {
          draftConfig: snapshot,
          publishedConfig: snapshot,
          version: newVersion,
          updatedById: actor?.id
        }
      });
    } else if (entityType === 'NAVIGATION') {
      const nav = await prisma.navigationConfiguration.findUnique({ where: { roleScope: entityKey } });
      if (!nav) throw new Error(`Target navigation "${entityKey}" not found.`);
      const newVersion = nav.version + 1;

      await prisma.navigationConfiguration.update({
        where: { roleScope: entityKey },
        data: {
          draftConfig: snapshot,
          publishedConfig: snapshot,
          version: newVersion,
          updatedById: actor?.id
        }
      });
    } else {
      throw new Error(`Rollback not supported for entity type "${entityType}".`);
    }

    await this.auditSvc.log({
      actorId: actor?.id,
      action: 'CONFIG_ROLLED_BACK',
      entityType: `VERSION_${entityType}`,
      entityId: versionRecord.id,
      metadata: {
        entityKey,
        restoredVersion: versionRecord.version
      }
    });

    return {
      success: true,
      message: `Successfully rolled back ${entityType} "${entityKey}" to Version ${versionRecord.version}.`
    };
  }
}

export const platformConfigService = new PlatformConfigService();
export default platformConfigService;
