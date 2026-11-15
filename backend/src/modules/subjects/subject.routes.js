import { Router } from 'express';
import subjectController from './subject.controller.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { requireRole } from '../../auth/requireRole.js';
import { ROLES } from '../../auth/rolePermissions.js';

const router = Router();

// Public / Authenticated discovery routes
router.get('/', subjectController.listSubjects);
router.get('/:id', subjectController.getSubjectById);

// Admin-governed curriculum mutation
router.post(
  '/',
  requireAuth,
  requireRole(ROLES.ADMIN, ROLES.SUPER_ADMIN),
  subjectController.createSubject
);

export default router;
