/**
 * PJ Study UI Configuration & Theme Studio Seeding Module
 * Seeds design tokens, navigation structures, and visual website builder templates.
 * Enforces the established editorial-minimalist design system and clean labels.
 */

import { platformConfigService } from '../../src/modules/platformConfig/platformConfig.service.js';

export async function seedUiConfig(prisma, options = {}) {
  const { dryRun = false } = options;
  const stats = {
    pageConfigs: { created: 0, existing: 0 },
    themes: { created: 0, existing: 0 },
    navigation: { created: 0, existing: 0, updated: 0 }
  };

  if (!dryRun) {
    try {
      await platformConfigService.initDefaultConfigurations();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('Note on platformConfigService initialization:', err.message);
    }

    // Ensure Navigation Configurations have strictly "Academic Architecture" (without legacy KRMU suffix)
    const navConfigs = await prisma.navigationConfiguration.findMany();
    for (const c of navConfigs) {
      let rawDraft = JSON.stringify(c.draftConfig || {});
      let rawPub = JSON.stringify(c.publishedConfig || {});

      let modified = false;
      if (rawDraft.includes('Academic Architecture (KRMU)') || rawDraft.includes('Academic Architecture (krmu)') || rawDraft.includes('Academic Architecture — KRMU')) {
        rawDraft = rawDraft
          .replaceAll('Academic Architecture (KRMU)', 'Academic Architecture')
          .replaceAll('Academic Architecture (krmu)', 'Academic Architecture')
          .replaceAll('Academic Architecture — KRMU', 'Academic Architecture');
        modified = true;
      }

      if (rawPub.includes('Academic Architecture (KRMU)') || rawPub.includes('Academic Architecture (krmu)') || rawPub.includes('Academic Architecture — KRMU')) {
        rawPub = rawPub
          .replaceAll('Academic Architecture (KRMU)', 'Academic Architecture')
          .replaceAll('Academic Architecture (krmu)', 'Academic Architecture')
          .replaceAll('Academic Architecture — KRMU', 'Academic Architecture');
        modified = true;
      }

      if (modified) {
        stats.navigation.updated++;
        await prisma.navigationConfiguration.update({
          where: { id: c.id },
          data: {
            draftConfig: JSON.parse(rawDraft),
            publishedConfig: JSON.parse(rawPub)
          }
        });
      } else {
        stats.navigation.existing++;
      }
    }
  }

  return { stats };
}
