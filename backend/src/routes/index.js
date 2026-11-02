import { Router } from 'express';
import env from '../config/env.js';
import authRoutes from '../modules/auth/auth.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';
import noteRoutes from '../modules/notes/note.routes.js';

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

/**
 * Public platform configuration & capability metadata endpoint.
 * Centralizes public brand identity and feature roadmap status without exposing secrets.
 *
 * GET /api/v1/config
 */
router.get('/config', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      product: 'PJ Study',
      tagline: 'Your Entire Study World, One Place.',
      version: '1.0.0',
      environment: env.nodeEnv,
      features: {
        designSystem: 'active',
        appShell: 'active',
        authentication: 'active',
        roleBasedAccessControl: 'active',
        notesCatalog: 'foundation',
        aiStudyTools: 'planned',
        peerReviews: 'planned'
      }
    }
  });
});

/**
 * Authentication and session lifecycle routes.
 * /api/v1/auth/...
 */
router.use('/auth', authRoutes);

/**
 * Administrative and RBAC governance routes.
 * /api/v1/admin/...
 */
router.use('/admin', adminRoutes);

/**
 * Study notes and ownership-governed resources.
 * /api/v1/notes/...
 */
router.use('/notes', noteRoutes);

export default router;
