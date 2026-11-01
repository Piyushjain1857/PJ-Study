import { Router } from 'express';
import env from '../config/env.js';

const router = Router();

/**
 * Health check endpoint.
 * Reports server status, current timestamp, uptime, and runtime environment.
 * Does not expose sensitive configurations or credentials.
 *
 * GET /api/v1/health
 */
router.get('/health', (req, res) => {
  const healthData = {
    status: 'healthy',
    product: 'PJ Study',
    tagline: 'Your Entire Study World, One Place.',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: env.nodeEnv
  };

  res.status(200).json({
    success: true,
    data: healthData
  });
});

export default router;

