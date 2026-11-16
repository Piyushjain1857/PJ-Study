import { Router } from 'express';
import env from '../config/env.js';
import authRoutes from '../modules/auth/auth.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';
import adminWorkspaceRoutes from '../modules/adminWorkspace/adminWorkspace.routes.js';
import academicRoutes from '../modules/academics/academic.routes.js';
import noteRoutes from '../modules/notes/note.routes.js';
import categoryRoutes from '../modules/categories/category.routes.js';
import courseRoutes from '../modules/courses/course.routes.js';
import subjectRoutes from '../modules/subjects/subject.routes.js';
import dashboardRoutes from '../modules/dashboard/dashboard.routes.js';
import recommendationRoutes from '../modules/recommendations/recommendation.routes.js';
import reviewRoutes from '../modules/reviews/review.routes.js';
import profileRoutes from '../modules/profile/profile.routes.js';
import contributorRoutes from '../modules/profile/contributor.routes.js';
import notificationRoutes from '../modules/notifications/notification.routes.js';
import seoRoutes from '../modules/seo/seo.routes.js';
import { publicConfigRouter, adminConfigRouter } from '../modules/platformConfig/platformConfig.routes.js';
import { requireAuth } from '../auth/requireAuth.js';
import noteController from '../modules/notes/note.controller.js';

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
 * Platform Owner Dynamic Visual Configuration Suite (Step 20)
 * Public delivery: /api/v1/platform/config/public, /workspace
 * Super Admin control: /api/v1/admin/config/...
 */
router.use('/platform/config', publicConfigRouter);
router.use('/admin/config', adminConfigRouter);

/**
 * Administrative and RBAC governance routes.
 * /api/v1/admin/...
 */
router.use('/admin', adminRoutes);

/**
 * Dedicated Admin Workspace routes (former Moderator).
 * /api/v1/admin-workspace/...
 */
router.use('/admin-workspace', adminWorkspaceRoutes);

/**
 * Unified Academic Content Management & Dynamic Course Hierarchy
 * /api/v1/academics/...
 */
router.use('/academics', academicRoutes);

/**
 * Academic category metadata routes.
 * /api/v1/categories/...
 */
router.use('/categories', categoryRoutes);

/**
 * Academic course catalog routes.
 * /api/v1/courses/...
 */
router.use('/courses', courseRoutes);

/**
 * Academic curriculum subject routes.
 * /api/v1/subjects/...
 */
router.use('/subjects', subjectRoutes);

/**
 * Study notes and ownership-governed resources.
 * /api/v1/notes/...
 */
router.use('/notes', noteRoutes);

/**
 * Student personalized dashboard and learning analytics.
 * /api/v1/dashboard/...
 */
router.use('/dashboard', dashboardRoutes);

/**
 * Smart notes recommendation engine & academic discovery.
 * /api/v1/recommendations/...
 */
router.use('/recommendations', recommendationRoutes);

/**
 * Notes ratings, reviews, helpful votes & quality feedback.
 * /api/v1/reviews/...
 */
router.use('/reviews', reviewRoutes);

/**
 * Scholar personal profile and academic identity.
 * /api/v1/profile/...
 */
router.use('/profile', profileRoutes);

/**
 * Public contributor profiles and approved manuscripts.
 * /api/v1/contributors/...
 */
router.use('/contributors', contributorRoutes);

/**
 * In-app notifications, unread count & delivery preferences.
 * /api/v1/notifications/...
 */
router.use('/notifications', notificationRoutes);

/**
 * Technical SEO, dynamic sitemaps & robots routes.
 * /api/v1/sitemap.xml, /api/v1/robots.txt
 */
router.use('/', seoRoutes);

/**
 * User personal resources shortcut (/api/v1/users/me/notes)
 */
router.get('/users/me/notes', requireAuth, noteController.getMyNotes);

export default router;
