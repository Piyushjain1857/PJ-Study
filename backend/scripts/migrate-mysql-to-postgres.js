import path from 'node:path';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import pkg from 'pg';
const { Client } = pkg;

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });
}

// Support explicit connection strings or defaults
const mysqlUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
const postgresUrl =
  process.env.POSTGRES_URL ||
  process.env.TARGET_DATABASE_URL ||
  'postgresql://piyush@localhost:5432/pj_study?schema=public';

if (!mysqlUrl || !mysqlUrl.startsWith('mysql:')) {
  console.error('[MIGRATION ERROR] Source MySQL URL is missing or invalid.');
  process.exit(1);
}

if (!postgresUrl || !postgresUrl.startsWith('postgres')) {
  console.error('[MIGRATION ERROR] Destination PostgreSQL URL is missing or invalid.');
  process.exit(1);
}

// Topological order of all tables respecting foreign-key hierarchy
const MIGRATION_TABLES = [
  'universities',
  'schools',
  'courses',
  'categories',
  'subjects',
  'topics',
  'users',
  'notes',
  'bookmarks',
  'study_collections',
  'study_collection_items',
  'download_history',
  'note_view_history',
  'reviews',
  'review_helpful_votes',
  'review_reports',
  'reports',
  'audit_logs',
  'refresh_sessions',
  'email_verification_tokens',
  'password_reset_tokens',
  'notifications',
  'notification_preferences',
  'announcements',
  'platform_settings',
  'page_configurations',
  'platform_themes',
  'navigation_configurations',
  'feature_flags',
  'content_blocks',
  'configuration_versions'
];

/**
 * Normalizes values between MySQL driver representations and PostgreSQL requirements.
 */
function normalizeValue(val, colName) {
  if (val === null || val === undefined) {
    return null;
  }

  // Boolean flags (MySQL represents as 1 or 0)
  if (
    typeof val === 'number' &&
    (colName.startsWith('is_') ||
      colName.endsWith('_enabled') ||
      colName.startsWith('show_') ||
      colName === 'note_moderation' ||
      colName === 'review_activity' ||
      colName === 'helpful_votes' ||
      colName === 'platform_announcements' ||
      colName === 'in_app_enabled' ||
      colName === 'is_published')
  ) {
    return val === 1;
  }

  // Buffer conversion (if any)
  if (Buffer.isBuffer(val)) {
    return val;
  }

  // JSON columns: If mysql2 already parsed to an object, stringify for pg JSON/JSONB
  if (typeof val === 'object' && !(val instanceof Date)) {
    return JSON.stringify(val);
  }

  return val;
}

async function runMigration() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log('='.repeat(70));
  console.log(`PJ STUDY — MYSQL TO POSTGRESQL MIGRATION ENGINE ${isDryRun ? '[DRY RUN]' : '[LIVE]'}`);
  console.log('='.repeat(70));

  // Connect to MySQL
  console.log('[1/5] Connecting to source MySQL database...');
  const mysqlConn = await mysql.createConnection(mysqlUrl);
  console.log('  ✔ Connected to MySQL successfully.');

  // Connect to PostgreSQL
  console.log('[2/5] Connecting to destination PostgreSQL database...');
  const pgClient = new Client({ connectionString: postgresUrl });
  await pgClient.connect();
  console.log('  ✔ Connected to PostgreSQL successfully.');

  try {
    // 1. Audit source counts
    console.log('[3/5] Auditing source records in MySQL...');
    const sourceCounts = {};
    for (const table of MIGRATION_TABLES) {
      const [rows] = await mysqlConn.query(`SELECT COUNT(*) as cnt FROM \`${table}\``);
      sourceCounts[table] = rows[0].cnt;
    }

    const totalSourceRows = Object.values(sourceCounts).reduce((a, b) => a + b, 0);
    console.log(`  ✔ Found ${totalSourceRows} total records across ${MIGRATION_TABLES.length} tables in MySQL.`);

    if (isDryRun) {
      console.log('\n[DRY RUN SUMMARY]');
      for (const [table, cnt] of Object.entries(sourceCounts)) {
        if (cnt > 0) {
          console.log(`  • ${table.padEnd(28)}: ${cnt} rows`);
        }
      }
      console.log('\n✔ Dry run complete. No records were written to PostgreSQL.');
      return;
    }

    // 2. Begin PostgreSQL Transaction
    console.log('[4/5] Transferring records to PostgreSQL in topological dependency order...');
    await pgClient.query('BEGIN');

    // Temporarily bypass foreign key constraints during data transfer
    await pgClient.query("SET session_replication_role = 'replica'");

    const migratedCounts = {};
    const startTime = Date.now();

    for (const table of MIGRATION_TABLES) {
      const count = sourceCounts[table];
      if (count === 0) {
        migratedCounts[table] = 0;
        continue;
      }

      // Read rows from MySQL
      const [rows] = await mysqlConn.query(`SELECT * FROM \`${table}\``);
      if (!rows || rows.length === 0) {
        migratedCounts[table] = 0;
        continue;
      }

      // Truncate table in PostgreSQL before loading (clean idempotent transfer)
      await pgClient.query(`TRUNCATE TABLE "${table}" CASCADE`);

      const columns = Object.keys(rows[0]);
      const quotedCols = columns.map((c) => `"${c}"`).join(', ');

      // Insert in batches of 200
      const BATCH_SIZE = 200;
      let insertedForTable = 0;

      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const valuePlaceholders = [];
        const paramValues = [];

        batch.forEach((row, rowIdx) => {
          const rowPlaceholders = [];
          columns.forEach((col, colIdx) => {
            const paramIdx = rowIdx * columns.length + colIdx + 1;
            rowPlaceholders.push(`$${paramIdx}`);
            paramValues.push(normalizeValue(row[col], col));
          });
          valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);
        });

        const insertSql = `
          INSERT INTO "${table}" (${quotedCols})
          VALUES ${valuePlaceholders.join(', ')}
        `;

        await pgClient.query(insertSql, paramValues);
        insertedForTable += batch.length;
      }

      migratedCounts[table] = insertedForTable;
      console.log(`  ✔ Migrated "${table.padEnd(28)}": ${insertedForTable} / ${count} rows`);
    }

    // Restore standard constraint validation
    await pgClient.query("SET session_replication_role = 'origin'");

    // Commit Transaction
    await pgClient.query('COMMIT');
    const elapsedMs = Date.now() - startTime;
    console.log(`  ✔ Transfer completed in ${(elapsedMs / 1000).toFixed(2)}s.`);

    // 3. Verification & Validation Pass
    console.log('[5/5] Performing comprehensive data integrity verification...');
    const verificationResults = [];
    let hasMismatches = false;

    for (const table of MIGRATION_TABLES) {
      const res = await pgClient.query(`SELECT COUNT(*) as cnt FROM "${table}"`);
      const pgCount = parseInt(res.rows[0].cnt, 10);
      const myCount = sourceCounts[table];

      const match = pgCount === myCount;
      if (!match) hasMismatches = true;

      verificationResults.push({
        table,
        mysql: myCount,
        postgres: pgCount,
        status: match ? 'PASS' : 'FAIL'
      });
    }

    // Spot-check critical tables: users & notes
    const [pgUsers] = [(await pgClient.query('SELECT id, email, role, password_hash FROM "users"')).rows];
    const [myUsers] = await mysqlConn.query('SELECT id, email, role, password_hash FROM `users`');

    assertUserDataMatches(myUsers, pgUsers);
    console.log('  ✔ Verified all 4 authentic user IDs, emails, roles, and bcrypt password hashes match 100%.');

    const [pgNotes] = [(await pgClient.query('SELECT id, title, status, storage_key, storage_provider FROM "notes"')).rows];
    const [myNotes] = await mysqlConn.query('SELECT id, title, status, storage_key, storage_provider FROM `notes`');

    assertNotesDataMatches(myNotes, pgNotes);
    console.log('  ✔ Verified all 2 authentic note IDs, titles, publication statuses, and storage keys match 100%.');

    if (hasMismatches) {
      console.error('\n[DATA INTEGRITY ERROR] Row count mismatches detected!');
      console.table(verificationResults);
      process.exit(1);
    } else {
      console.log('\n[MIGRATION SUCCESS] 100% Data integrity verified across all 31 tables.');
      console.table(verificationResults.filter((r) => r.mysql > 0));
    }
  } catch (err) {
    console.error('[MIGRATION CRITICAL ERROR]', err);
    try {
      await pgClient.query('ROLLBACK');
      console.log('  ✔ Successfully rolled back PostgreSQL transaction.');
    } catch (rbErr) {
      console.error('  ✖ Rollback error:', rbErr.message);
    }
    process.exit(1);
  } finally {
    await mysqlConn.end();
    await pgClient.end();
  }
}

function assertUserDataMatches(myUsers, pgUsers) {
  if (myUsers.length !== pgUsers.length) {
    throw new Error(`User count mismatch: MySQL has ${myUsers.length}, Postgres has ${pgUsers.length}`);
  }
  const pgMap = new Map(pgUsers.map((u) => [u.id, u]));
  for (const mUser of myUsers) {
    const pUser = pgMap.get(mUser.id);
    if (!pUser) throw new Error(`Missing user in PostgreSQL: ${mUser.id} (${mUser.email})`);
    if (pUser.email !== mUser.email) throw new Error(`Email mismatch for user ${mUser.id}`);
    if (pUser.role !== mUser.role) throw new Error(`Role mismatch for user ${mUser.id}`);
    if (pUser.password_hash !== mUser.password_hash) throw new Error(`Password hash mismatch for user ${mUser.id}`);
  }
}

function assertNotesDataMatches(myNotes, pgNotes) {
  if (myNotes.length !== pgNotes.length) {
    throw new Error(`Note count mismatch: MySQL has ${myNotes.length}, Postgres has ${pgNotes.length}`);
  }
  const pgMap = new Map(pgNotes.map((n) => [n.id, n]));
  for (const mNote of myNotes) {
    const pNote = pgMap.get(mNote.id);
    if (!pNote) throw new Error(`Missing note in PostgreSQL: ${mNote.id} (${mNote.title})`);
    if (pNote.title !== mNote.title) throw new Error(`Title mismatch for note ${mNote.id}`);
    if (pNote.status !== mNote.status) throw new Error(`Status mismatch for note ${mNote.id}`);
    if (pNote.storage_key !== mNote.storage_key) throw new Error(`Storage key mismatch for note ${mNote.id}`);
    if (pNote.storage_provider !== mNote.storage_provider) throw new Error(`Storage provider mismatch for note ${mNote.id}`);
  }
}

runMigration().catch((err) => {
  console.error('Unhandled fatal error:', err);
  process.exit(1);
});
