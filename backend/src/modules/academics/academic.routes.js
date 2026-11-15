import { Router } from 'express';
import academicController from './academic.controller.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { requireRole } from '../../auth/requireRole.js';
import { ROLES } from '../../auth/rolePermissions.js';

const router = Router();

/**
 * Public & Authenticated Academic Discovery Routes
 */
router.get('/overview', academicController.getOverview);
router.get('/universities', academicController.listUniversities);
router.get('/universities/:id', academicController.getUniversity);
router.get('/schools', academicController.listSchools);
router.get('/schools/:id', academicController.getSchool);
router.get('/courses', academicController.listCourses);
router.get('/courses/:id', academicController.getCourse);
router.get('/courses/:id/semesters', academicController.getCourseSemesters);
router.get('/subjects', academicController.listSubjects);
router.get('/subjects/:id', academicController.getSubject);
router.get('/categories', academicController.listCategories);
router.get('/categories/:id', academicController.getCategory);

/**
 * Super Admin Taxonomy Mutations
 */
router.post(
  '/universities',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  academicController.createUniversity
);
router.patch(
  '/universities/:id',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  academicController.updateUniversity
);
router.delete(
  '/universities/:id',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  academicController.deleteUniversity
);

router.post(
  '/schools',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  academicController.createSchool
);
router.patch(
  '/schools/:id',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  academicController.updateSchool
);
router.delete(
  '/schools/:id',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  academicController.deleteSchool
);

router.post(
  '/courses',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  academicController.createCourse
);
router.patch(
  '/courses/:id',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  academicController.updateCourse
);
router.delete(
  '/courses/:id',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  academicController.deleteCourse
);

router.post(
  '/subjects',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  academicController.createSubject
);
router.patch(
  '/subjects/:id',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  academicController.updateSubject
);
router.delete(
  '/subjects/:id',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  academicController.deleteSubject
);

router.post(
  '/categories',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  academicController.createCategory
);
router.patch(
  '/categories/:id',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  academicController.updateCategory
);
router.delete(
  '/categories/:id',
  requireAuth,
  requireRole(ROLES.SUPER_ADMIN),
  academicController.deleteCategory
);

export default router;
