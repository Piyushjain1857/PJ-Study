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
  const isConfirmed = args.includes('--confirm-seed') || process.env.ALLOW_DATABASE_SEED === 'true';

  // Explicit opt-in safety guard: Never seed automatically on startup, migration, or deploy
  if (!isVerifyOnly && !isDryRun && !isConfirmed) {
    // eslint-disable-next-line no-console
    console.warn(
      '\n⚠️  [SEED GUARD] Database seeding was invoked without explicit authorization.\n' +
      '   To prevent accidental or automated user creation, seeding is strictly opt-in.\n' +
      '   To run seeding intentionally, provide the explicit confirmation flag:\n' +
      '     npm run seed -- --confirm-seed\n' +
      '   or set ALLOW_DATABASE_SEED=true in your environment.\n' +
      '   Exiting cleanly with zero changes applied to the database.\n'
    );
    process.exit(0);
  }

  let mode = 'core'; // Default to clean core start (starts completely from scratch)
  for (const arg of args) {
    if (arg.startsWith('--mode=')) {
      const parsedMode = arg.split('=')[1].toLowerCase();
      if (['core', 'demo', 'full'].includes(parsedMode)) {
        mode = parsedMode;
      }
    }
  }

  // Production environmental security block
  const isProduction = process.env.NODE_ENV === 'production';
  const dbUrl = process.env.DATABASE_URL || '';
  const isRemoteDb = dbUrl.includes('rds.amazonaws.com') || dbUrl.includes('cloudsql') || dbUrl.includes('railway') || dbUrl.includes('render');

  if ((isProduction || isRemoteDb) && (mode === 'demo' || mode === 'full') && !forceProduction) {
    // eslint-disable-next-line no-console
    console.error(
      `\n🚫 [SECURITY HALT] Seeding mode "${mode}" is strictly prohibited in production and cloud environments.\n` +
      `   Automated demo data and demo notes cannot be inserted into production databases.\n` +
      `   Operation terminated with zero database writes.\n`
    );
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log(`[AUDIT:SEED] Database seeding engine explicitly authorized. Mode: "${mode}", DryRun: ${isDryRun}`);

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
