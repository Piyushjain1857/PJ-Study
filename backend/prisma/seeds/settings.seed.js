/**
 * PJ Study Platform Settings & Feature Flags Seeding Module
 * Seeds required system settings, feature flags, and administrative permissions.
 */

import { DEFAULT_FEATURE_FLAGS, DEFAULT_ADMIN_PERMISSION_SCOPES } from '../../src/modules/platformConfig/defaultConfigs.js';

export const SYSTEM_SETTINGS = [
  {
    key: 'platform_branding',
    category: 'GENERAL',
    isPublic: true,
    description: 'Core application branding and university identity metadata.',
    value: {
      appName: 'PJ Study',
      institutionName: 'K.R. Mangalam University',
      institutionCode: 'KRMU',
      tagline: 'Your Entire Study World, One Place.',
      campusLocation: 'Gurugram, India',
      officialWebsite: 'https://www.krmangalam.edu.in'
    }
  },
  {
    key: 'upload_policy',
    category: 'SECURITY',
    isPublic: false,
    description: 'Document upload limits and permitted document MIME types.',
    value: {
      maxFileSizeBytes: 52428800, // 50MB
      allowedExtensions: ['.pdf', '.docx', '.pptx', '.txt', '.md'],
      requireDirectPublishingAdminAuth: true
    }
  },
  {
    key: 'admin_permission_scopes',
    category: 'SECURITY',
    isPublic: false,
    description: 'Granular capability scopes assigned to faculty evaluators and academic admins.',
    value: DEFAULT_ADMIN_PERMISSION_SCOPES
  }
];

export async function seedSettings(prisma, options = {}) {
  const { dryRun = false } = options;
  const stats = {
    settings: { created: 0, existing: 0 },
    featureFlags: { created: 0, existing: 0 }
  };

  // 1. Platform Settings
  for (const s of SYSTEM_SETTINGS) {
    const existing = await prisma.platformSetting.findUnique({ where: { key: s.key } });
    const stringVal = typeof s.value === 'string' ? s.value : JSON.stringify(s.value);
    if (existing) {
      stats.settings.existing++;
    } else {
      stats.settings.created++;
      if (!dryRun) {
        await prisma.platformSetting.create({
          data: {
            key: s.key,
            category: s.category,
            description: s.description,
            value: stringVal
          }
        });
      }
    }
  }

  // 2. Feature Flags
  for (const flag of DEFAULT_FEATURE_FLAGS) {
    const existing = await prisma.featureFlag.findUnique({ where: { key: flag.key } });
    if (existing) {
      stats.featureFlags.existing++;
    } else {
      stats.featureFlags.created++;
      if (!dryRun) {
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
  }

  return { stats };
}
