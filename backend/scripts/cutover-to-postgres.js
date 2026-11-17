#!/usr/bin/env node

/**
 * PJ Study — Automated Production Cutover Engine
 * Safely executes the final cutover from MySQL to PostgreSQL:
 * 1. Takes a final incremental backup of MySQL
 * 2. Migrates any delta data to PostgreSQL
 * 3. Verifies data integrity & checksums
 * 4. Activates PostgreSQL schema & Prisma Client
 * 5. Updates backend/.env DATABASE_URL
 * 6. Verifies database connectivity
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');
const envPath = path.resolve(backendDir, '.env');

dotenv.config({ path: envPath });

console.log('======================================================================');
console.log('PJ STUDY — POSTGRESQL PRODUCTION CUTOVER ENGINE');
console.log('======================================================================');

async function main() {
  const targetPostgresUrl = process.env.POSTGRES_DATABASE_URL || 'postgresql://piyush@localhost:5432/pj_study?schema=public';

  // Step 1: Final incremental backup
  console.log('\n[1/6] Taking final pre-cutover MySQL snapshot...');
  execSync('node scripts/backup-mysql.js', { cwd: backendDir, stdio: 'inherit' });

  // Step 2: Final delta migration
  console.log('\n[2/6] Syncing all delta records from MySQL to PostgreSQL...');
  execSync('node scripts/migrate-mysql-to-postgres.js', { cwd: backendDir, stdio: 'inherit' });

  // Step 3: Verification
  console.log('\n[3/6] Verifying 100% data integrity & checksums...');
  execSync('node scripts/verify-migration-integrity.js', { cwd: backendDir, stdio: 'inherit' });

  // Step 4: Schema activation
  console.log('\n[4/6] Activating PostgreSQL Prisma schema...');
  const postgresSchemaPath = path.resolve(backendDir, 'prisma/schema.postgresql.prisma');
  const activeSchemaPath = path.resolve(backendDir, 'prisma/schema.prisma');
  fs.copyFileSync(postgresSchemaPath, activeSchemaPath);

  // Step 5: Update backend/.env
  console.log('\n[5/6] Updating backend/.env connection string to PostgreSQL...');
  let envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('DATABASE_URL=')) {
    envContent = envContent.replace(
      /^DATABASE_URL=.*$/m,
      `DATABASE_URL="${targetPostgresUrl}"`
    );
  } else {
    envContent += `\nDATABASE_URL="${targetPostgresUrl}"\n`;
  }
  fs.writeFileSync(envPath, envContent, 'utf8');

  // Step 6: Generate Prisma client & verify
  console.log('\n[6/6] Generating Prisma Client for PostgreSQL...');
  execSync('npx prisma generate', { cwd: backendDir, stdio: 'inherit' });

  console.log('\nVerifying PostgreSQL connection via client...');
  const client = new pg.Client({ connectionString: targetPostgresUrl });
  await client.connect();
  const res = await client.query('SELECT count(*) FROM users');
  console.log(`  ✔ Successfully connected to PostgreSQL! Total users: ${res.rows[0].count}`);
  await client.end();

  console.log('\n======================================================================');
  console.log('✔ PRODUCTION CUTOVER TO POSTGRESQL COMPLETED SUCCESSFULLY!');
  console.log('  Database: PostgreSQL 16');
  console.log('  URL:      ' + targetPostgresUrl);
  console.log('  Status:   ACTIVE');
  console.log('======================================================================\n');
}

main().catch((err) => {
  console.error('\n✖ CUTOVER FAILED:', err.message);
  process.exit(1);
});
