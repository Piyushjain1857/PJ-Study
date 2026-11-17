#!/usr/bin/env node

/**
 * PJ Study — Automated Rollback Engine (PostgreSQL -> MySQL)
 * Reverts the database back to MySQL:
 * 1. Restores MySQL schema
 * 2. Restores MySQL connection string in backend/.env
 * 3. Regenerates Prisma Client for MySQL
 * 4. Verifies database connectivity
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import mysql from 'mysql2/promise';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');
const envPath = path.resolve(backendDir, '.env');

console.log('======================================================================');
console.log('PJ STUDY — DATABASE ROLLBACK ENGINE (POSTGRESQL -> MYSQL)');
console.log('======================================================================');

async function main() {
  const mysqlUrl = process.env.MYSQL_DATABASE_URL || 'mysql://root:rootpassword@127.0.0.1:3306/pj_study';

  // Step 1: Schema restoration
  console.log('\n[1/4] Restoring MySQL Prisma schema...');
  const mysqlSchemaPath = path.resolve(backendDir, 'prisma/schema.mysql.prisma');
  const activeSchemaPath = path.resolve(backendDir, 'prisma/schema.prisma');
  fs.copyFileSync(mysqlSchemaPath, activeSchemaPath);

  // Step 2: Update backend/.env
  console.log('\n[2/4] Restoring backend/.env connection string to MySQL...');
  let envContent = fs.readFileSync(envPath, 'utf8');
  if (envContent.includes('DATABASE_URL=')) {
    envContent = envContent.replace(
      /^DATABASE_URL=.*$/m,
      `DATABASE_URL="${mysqlUrl}"`
    );
  } else {
    envContent += `\nDATABASE_URL="${mysqlUrl}"\n`;
  }
  fs.writeFileSync(envPath, envContent, 'utf8');

  // Step 3: Regenerate Prisma Client
  console.log('\n[3/4] Regenerating Prisma Client for MySQL...');
  execSync('npx prisma generate', { cwd: backendDir, stdio: 'inherit' });

  // Step 4: Verification
  console.log('\n[4/4] Verifying MySQL connection...');
  const connection = await mysql.createConnection(mysqlUrl);
  const [rows] = await connection.query('SELECT count(*) as count FROM users');
  console.log(`  ✔ Successfully connected to MySQL! Total users: ${rows[0].count}`);
  await connection.end();

  console.log('\n======================================================================');
  console.log('✔ ROLLBACK TO MYSQL COMPLETED SUCCESSFULLY!');
  console.log('  Database: MySQL');
  console.log('  URL:      ' + mysqlUrl);
  console.log('  Status:   ACTIVE');
  console.log('======================================================================\n');
}

main().catch((err) => {
  console.error('\n✖ ROLLBACK FAILED:', err.message);
  process.exit(1);
});
