import { PrismaClient } from '@prisma/client';
import env from './env.js';

/**
 * Global PrismaClient instance singleton.
 * Prevents multiple instances in development during hot-reloads.
 */
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error', 'warn']
  });
} else {
  if (!global.__pj_prisma) {
    global.__pj_prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error']
    });
  }
  prisma = global.__pj_prisma;
}

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
    console.error('Error disconnecting from database:', error.message);
  }
}

export { prisma };
export default prisma;
