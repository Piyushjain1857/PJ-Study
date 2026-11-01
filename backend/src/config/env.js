import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Validates and normalizes required environment variables.
 *
 * @throws {Error} If critical environment variables are missing or invalid
 * @returns {Readonly<{
 *   port: number,
 *   nodeEnv: string,
 *   databaseUrl: string,
 *   frontendUrl: string,
 *   isProduction: boolean,
 *   isDevelopment: boolean
 * }>}
 */
function validateAndLoadConfig() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const port = parseInt(process.env.PORT || '5000', 10);
  const databaseUrl = process.env.DATABASE_URL || '';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const errors = [];

  if (Number.isNaN(port) || port <= 0 || port > 65535) {
    errors.push('PORT must be a valid port number between 1 and 65535.');
  }

  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    errors.push(
      `NODE_ENV must be one of 'development', 'test', or 'production'. Received: "${nodeEnv}"`
    );
  }

  // DATABASE_URL is required for database operations.
  // In development/test, we warn or validate structure.
  if (!databaseUrl && nodeEnv === 'production') {
    errors.push('DATABASE_URL is required in production environment.');
  }

  if (errors.length > 0) {
    const errorMessage = `Environment validation failed:\n - ${errors.join('\n - ')}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  return Object.freeze({
    port,
    nodeEnv,
    databaseUrl,
    frontendUrl,
    isProduction: nodeEnv === 'production',
    isDevelopment: nodeEnv === 'development',
    isTest: nodeEnv === 'test'
  });
}

export const env = validateAndLoadConfig();
export default env;
