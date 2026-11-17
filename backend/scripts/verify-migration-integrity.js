import path from 'node:path';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import pkg from 'pg';
const { Client } = pkg;

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });
}

const mysqlUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
const postgresUrl =
  process.env.POSTGRES_URL ||
  process.env.TARGET_DATABASE_URL ||
  'postgresql://piyush@localhost:5432/pj_study?schema=public';

const TABLES = [
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

function sha256(data) {
  return crypto.createHash('sha256').update(String(data)).digest('hex');
}

async function verifyIntegrity() {
  console.log('='.repeat(75));
  console.log('PJ STUDY — COMPREHENSIVE DATA INTEGRITY & CHECKSUM VERIFICATION');
  console.log('='.repeat(75));

  const mysqlConn = await mysql.createConnection(mysqlUrl);
  const pgClient = new Client({ connectionString: postgresUrl });
  await pgClient.connect();

  let totalMismatches = 0;
  const report = [];

  try {
    for (const table of TABLES) {
      const [myRows] = await mysqlConn.query(`SELECT * FROM \`${table}\``);
      const pgRes = await pgClient.query(`SELECT * FROM "${table}"`);
      const pgRows = pgRes.rows;

      const myCount = myRows.length;
      const pgCount = pgRows.length;

      if (myCount !== pgCount) {
        totalMismatches++;
        report.push({
          table,
          mysqlCount: myCount,
          postgresCount: pgCount,
          idChecksumMatch: 'FAIL (Count Mismatch)',
          status: 'FAIL'
        });
        continue;
      }

      if (myCount === 0) {
        report.push({
          table,
          mysqlCount: 0,
          postgresCount: 0,
          idChecksumMatch: 'N/A (Empty)',
          status: 'PASS'
        });
        continue;
      }

      // Compute deterministic sorted ID hash
      const idCol = table === 'platform_settings' ? 'key' : 'id';
      const myIds = myRows.map((r) => String(r[idCol])).sort().join(':');
      const pgIds = pgRows.map((r) => String(r[idCol])).sort().join(':');

      const myHash = sha256(myIds);
      const pgHash = sha256(pgIds);

      const idMatch = myHash === pgHash;
      if (!idMatch) totalMismatches++;

      report.push({
        table,
        mysqlCount: myCount,
        postgresCount: pgCount,
        idChecksumMatch: idMatch ? 'PASS' : 'FAIL',
        status: idMatch ? 'PASS' : 'FAIL'
      });
    }

    // Deep inspections on core business models:
    console.log('\n[DEEP AUDIT 1: Users, Roles & Password Integrity]');
    const [myUsers] = await mysqlConn.query('SELECT id, email, role, password_hash, is_active FROM `users` ORDER BY id');
    const { rows: pgUsers } = await pgClient.query('SELECT id, email, role, password_hash, is_active FROM "users" ORDER BY id');

    for (let i = 0; i < myUsers.length; i++) {
      const mu = myUsers[i];
      const pu = pgUsers.find((u) => u.id === mu.id);
      if (!pu) throw new Error(`User ${mu.id} missing in PostgreSQL`);
      if (pu.email !== mu.email) throw new Error(`Email mismatch for ${mu.id}`);
      if (pu.role !== mu.role) throw new Error(`Role mismatch for ${mu.id}`);
      if (pu.password_hash !== mu.password_hash) throw new Error(`Password hash mismatch for ${mu.id}`);
      if (Boolean(pu.is_active) !== Boolean(mu.is_active)) throw new Error(`Status mismatch for ${mu.id}`);
      console.log(`  ✔ Verified User [${pu.role.padEnd(11)}] ${pu.email.padEnd(30)} ID=${pu.id}`);
    }

    console.log('\n[DEEP AUDIT 2: Notes, Publishing Status & Storage Key Invariants]');
    const [myNotes] = await mysqlConn.query(
      'SELECT id, title, status, storage_key, storage_provider, file_name, course_id, subject_id FROM `notes` ORDER BY id'
    );
    const { rows: pgNotes } = await pgClient.query(
      'SELECT id, title, status, storage_key, storage_provider, file_name, course_id, subject_id FROM "notes" ORDER BY id'
    );

    for (const mn of myNotes) {
      const pn = pgNotes.find((n) => n.id === mn.id);
      if (!pn) throw new Error(`Note ${mn.id} missing in PostgreSQL`);
      if (pn.title !== mn.title) throw new Error(`Title mismatch for ${mn.id}`);
      if (pn.status !== mn.status) throw new Error(`Status mismatch for ${mn.id}`);
      if (pn.storage_key !== mn.storage_key) throw new Error(`Storage key mismatch for ${mn.id}`);
      if (pn.storage_provider !== mn.storage_provider) throw new Error(`Storage provider mismatch for ${mn.id}`);
      if (pn.course_id !== mn.course_id) throw new Error(`Course FK mismatch for ${mn.id}`);
      if (pn.subject_id !== mn.subject_id) throw new Error(`Subject FK mismatch for ${mn.id}`);
      console.log(
        `  ✔ Verified Note "${pn.title}" [${pn.status}] Provider=${pn.storage_provider} Key=${pn.storage_key}`
      );
    }

    console.log('\n[DEEP AUDIT 3: Academic Catalog Relationships]');
    const [myCourses] = await mysqlConn.query('SELECT id, name, slug, semesters_count FROM `courses` ORDER BY id');
    const { rows: pgCourses } = await pgClient.query('SELECT id, name, slug, semesters_count FROM "courses" ORDER BY id');
    for (const mc of myCourses) {
      const pc = pgCourses.find((c) => c.id === mc.id);
      if (!pc || pc.slug !== mc.slug || pc.semesters_count !== mc.semesters_count) {
        throw new Error(`Course hierarchy mismatch for ${mc.slug}`);
      }
    }
    console.log(`  ✔ Verified ${pgCourses.length} courses and dynamic semester counts match.`);

    console.log('\n[SUMMARY TABLE]');
    console.table(report.filter((r) => r.mysqlCount > 0));

    if (totalMismatches > 0) {
      console.error(`\n✖ Verification FAILED with ${totalMismatches} mismatches.`);
      process.exit(1);
    } else {
      console.log('\n✔ ALL INTEGRITY CHECKS PASSED WITH 0 MISMATCHES.');
    }
  } finally {
    await mysqlConn.end();
    await pgClient.end();
  }
}

verifyIntegrity().catch((err) => {
  console.error('[INTEGRITY CHECK FATAL ERROR]', err);
  process.exit(1);
});
