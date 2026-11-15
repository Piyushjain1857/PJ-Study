import { Router } from 'express';
import courseController from './course.controller.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { requireRole } from '../../auth/requireRole.js';
import { ROLES } from '../../auth/rolePermissions.js';

const router = Router();

// Public / Authenticated discovery routes
router.get('/', courseController.listCourses);
router.get('/slug/:slug', courseController.getCourseBySlug);
router.get('/:id', courseController.getCourseById);

// Admin-governed course creation
router.post(
  '/',
  requireAuth,
  requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  courseController.createCourse
);

export default router;
