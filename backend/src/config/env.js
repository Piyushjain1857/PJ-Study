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
 *   jwtAccessSecret: string,
 *   jwtAccessExpiresIn: string,
 *   refreshTokenExpiresIn: string,
 *   passwordResetExpiresIn: string,
 *   emailVerificationExpiresIn: string,
 *   emailProvider: string,
 *   emailFrom: string,
 *   emailApiKey: string,
 *   isProduction: boolean,
 *   isDevelopment: boolean,
 *   isTest: boolean
 * }>}
 */
function validateAndLoadConfig() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const port = parseInt(process.env.PORT || '5000', 10);
  const databaseUrl = process.env.DATABASE_URL || '';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  // JWT & Session configurations
  const defaultDevSecret = 'pj_study_dev_super_secret_jwt_access_key_2026_min_32_chars';
  const jwtAccessSecret =
    process.env.JWT_ACCESS_SECRET || (nodeEnv !== 'production' ? defaultDevSecret : '');
  const jwtAccessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  const refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
  const passwordResetExpiresIn = process.env.PASSWORD_RESET_TOKEN_EXPIRES_IN || '15m';
  const emailVerificationExpiresIn = process.env.EMAIL_VERIFICATION_TOKEN_EXPIRES_IN || '24h';

  // Email service configurations
  const emailProvider = process.env.EMAIL_PROVIDER || 'console';
  const emailFrom = process.env.EMAIL_FROM || 'noreply@pjstudy.com';
  const emailApiKey = process.env.EMAIL_API_KEY || '';

  const errors = [];

  if (Number.isNaN(port) || port <= 0 || port > 65535) {
    errors.push('PORT must be a valid port number between 1 and 65535.');
  }

  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    errors.push(
      `NODE_ENV must be one of 'development', 'test', or 'production'. Received: "${nodeEnv}"`
    );
  }

  if (!databaseUrl && nodeEnv === 'production') {
    errors.push('DATABASE_URL is required in production environment.');
  }

  if (nodeEnv === 'production') {
    if (!jwtAccessSecret || jwtAccessSecret.length < 32) {
      errors.push(
        'JWT_ACCESS_SECRET is required in production and must be at least 32 characters long.'
      );
    }
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
    jwtAccessSecret,
    jwtAccessExpiresIn,
    refreshTokenExpiresIn,
    passwordResetExpiresIn,
    emailVerificationExpiresIn,
    emailProvider,
    emailFrom,
    emailApiKey,
    isProduction: nodeEnv === 'production',
    isDevelopment: nodeEnv === 'development',
    isTest: nodeEnv === 'test'
  });
}

export const env = validateAndLoadConfig();
export default env;
