/**
 * PJ Study Enterprise Database Seeding Engine
 * Entry point supporting:
 * - npm run seed / npx prisma db seed (Full mode)
 * - npm run seed:core (Core reference data only)
 * - npm run seed:demo (Core + Demo Scholar/Admin & Curated Notes)
 * - npm run seed:full (Complete development platform)
 * - npm run seed:verify (Validates database integrity)
 * - npm run seed:dry-run (Preview without writes)
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { runSeeder, formatSeedReport } from './seeds/index.js';
import { verifySeed } from './seeds/verifier.js';

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);

  // Parse CLI flags
  const isVerifyOnly = args.includes('--verify');
  const isDryRun = args.includes('--dry-run');
  const forceProduction = args.includes('--force-production-seed');

  let mode = 'core'; // Default to clean core start (starts completely from scratch)
  for (const arg of args) {
    if (arg.startsWith('--mode=')) {
      const parsedMode = arg.split('=')[1].toLowerCase();
      if (['core', 'demo', 'full'].includes(parsedMode)) {
        mode = parsedMode;
      }
    }
  }

  // 1. Standalone Verification Mode
  if (isVerifyOnly) {
    // eslint-disable-next-line no-console
    console.log('Running PJ Study Database Integrity Verification...\n');
    const ver = await verifySeed(prisma);

    for (const check of ver.checks) {
      const mark = check.passed ? '✓ [PASS]' : '✗ [FAIL]';
      // eslint-disable-next-line no-console
      console.log(`  ${mark.padEnd(9)} ${check.name.padEnd(28)} : ${check.details}`);
    }

    if (!ver.isValid) {
      // eslint-disable-next-line no-console
      console.error('\nVerification failed. One or more database integrity checks did not pass.');
      process.exit(1);
    }

    // eslint-disable-next-line no-console
    console.log('\n✓ Database integrity verified successfully.');
    return;
  }

  // 2. Run Seeder
  const report = await runSeeder(prisma, {
    mode,
    dryRun: isDryRun,
    forceProduction
  });

  // eslint-disable-next-line no-console
  console.log(formatSeedReport(report));

  // 3. Post-Seed Verification (unless dry-run)
  if (!isDryRun) {
    const postVerify = await verifySeed(prisma);
    if (!postVerify.isValid) {
      // eslint-disable-next-line no-console
      console.warn('Notice: Some verification checks flagged notes:');
      for (const c of postVerify.checks.filter((chk) => !chk.passed)) {
        // eslint-disable-next-line no-console
        console.warn(`  - ${c.name}: ${c.details}`);
      }
    } else {
      // eslint-disable-next-line no-console
      console.log('✓ Post-seeding integrity verification: 100% passed.');
    }
  }
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error('Fatal Seeding Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
