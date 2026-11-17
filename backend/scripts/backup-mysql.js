import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
if (!process.env.DATABASE_URL) {
  dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || !databaseUrl.startsWith('mysql:')) {
  console.error('[BACKUP ERROR] DATABASE_URL is not set or not a MySQL connection string.');
  process.exit(1);
}

const url = new URL(databaseUrl.replace(/^mysql:/, 'http:'));
const user = decodeURIComponent(url.username || 'root');
const password = decodeURIComponent(url.password || '');
const host = url.hostname || '127.0.0.1';
const port = url.port || '3306';
const database = url.pathname.replace(/^\//, '');

const backupDir = path.resolve(process.cwd(), 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true, mode: 0o700 });
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFilename = `mysql_pj_study_backup_${timestamp}.sql`;
const backupFilePath = path.join(backupDir, backupFilename);
const checksumFilePath = `${backupFilePath}.sha256`;

console.log(`[BACKUP] Initializing MySQL source backup for database "${database}" at ${host}:${port}...`);

const dumpArgs = [
  `-h${host}`,
  `-P${port}`,
  `-u${user}`,
  `--password=${password}`,
  '--single-transaction',
  '--quick',
  '--routines',
  '--triggers',
  '--hex-blob',
  database
];

const dumpProc = spawn('mysqldump', dumpArgs, {
  stdio: ['ignore', 'pipe', 'pipe']
});

const writeStream = fs.createWriteStream(backupFilePath, { mode: 0o600 });
const hash = crypto.createHash('sha256');

dumpProc.stdout.on('data', (chunk) => {
  hash.update(chunk);
  writeStream.write(chunk);
});

let stderrOutput = '';
dumpProc.stderr.on('data', (chunk) => {
  stderrOutput += chunk.toString();
});

dumpProc.on('close', (code) => {
  writeStream.end();
  if (code !== 0) {
    console.error(`[BACKUP ERROR] mysqldump failed with exit code ${code}:`, stderrOutput);
    if (fs.existsSync(backupFilePath)) fs.unlinkSync(backupFilePath);
    process.exit(1);
  }

  const sha256 = hash.digest('hex');
  fs.writeFileSync(checksumFilePath, `${sha256}  ${backupFilename}\n`, { mode: 0o600 });
  const stats = fs.statSync(backupFilePath);

  console.log(`[BACKUP SUCCESS] Backup created safely at: ${backupFilePath}`);
  console.log(`[BACKUP METADATA] Size: ${(stats.size / 1024).toFixed(2)} KB | SHA256: ${sha256}`);
  process.exit(0);
});
