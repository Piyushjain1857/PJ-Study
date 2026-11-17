import { Router } from 'express';
import { requireAuth } from '../../auth/requireAuth.js';
import { requireRole } from '../../auth/requireRole.js';
import { ROLES } from '../../auth/rolePermissions.js';
import storageController from './storage.controller.js';

const router = Router();

// Storage provider status & health check
router.get(
  '/status',
  requireAuth,
  requireRole([ROLES.ADMIN, ROLES.SUPER_ADMIN]),
  storageController.getStatus
);

// Generate Google Drive OAuth consent URL
router.get(
  '/google/oauth/url',
  requireAuth,
  requireRole([ROLES.SUPER_ADMIN]),
  storageController.getGoogleAuthUrl
);

// Google OAuth redirect callback (open redirect landing from Google)
router.get(
  '/google/oauth/callback',
  storageController.handleGoogleCallback
);

export default router;
