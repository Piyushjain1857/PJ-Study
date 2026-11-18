import { PrismaClient } from '@prisma/client';
import env from './env.js';

/**
 * Global PrismaClient instance singleton.
 * Prevents multiple instances in development during hot-reloads
 * and ensures single shared connection pool in production.
 */
const isVerbosePrisma = process.env.PRISMA_VERBOSE === 'true';

if (!globalThis.__pj_prisma) {
  globalThis.__pj_prisma = new PrismaClient({
    log: isVerbosePrisma ? ['query', 'info', 'warn', 'error'] : ['error']
  });
}
const prisma = globalThis.__pj_prisma;

/**
 * Connect to the database with retry or check.
 *
 * @returns {Promise<boolean>} True if connected, false otherwise
 */
export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✓ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('✕ Database connection failed:', error.message);
    return false;
  }
}

/**
 * Disconnect from the database gracefully.
 *
 * @returns {Promise<void>}
 */
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error closing database connection:', error.message);
  }
}

/**
 * Checks whether the active database connection is PostgreSQL.
 *
 * @returns {boolean}
 */
export function isPostgresDatabase() {
  const url = process.env.DATABASE_URL || env.databaseUrl || '';
  return url.startsWith('postgres');
}

export { prisma };
export default prisma;
