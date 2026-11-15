import { Router } from 'express';
import profileController from './profile.controller.js';
import { requireAuth } from '../../auth/requireAuth.js';
import { validateUpdateProfile, validatePrivacySettings } from './profile.validation.js';
import { avatarUpload, handleAvatarUploadErrors } from './profile.upload.js';
import { fileUploadLimiter } from '../../middleware/rateLimiters.js';

const router = Router();

// Public avatar image streaming endpoint
router.get('/avatar/:filename', profileController.getAvatar);

// Academic options helper (courses, available semesters)
router.get('/academic-options', profileController.getAcademicOptions);

// Authenticated scholar personal profile routes
router.get('/me', requireAuth, profileController.getMe);
router.patch('/me', requireAuth, validateUpdateProfile, profileController.updateMe);
router.patch('/me/privacy', requireAuth, validatePrivacySettings, profileController.updatePrivacy);

// Avatar management
router.post(
  '/me/avatar',
  requireAuth,
  fileUploadLimiter,
  avatarUpload.single('avatar'),
  handleAvatarUploadErrors,
  profileController.uploadAvatar
);
router.delete('/me/avatar', requireAuth, profileController.removeAvatar);

// Personal uploads and metrics
router.get('/me/uploads', requireAuth, profileController.getOwnUploads);
router.get('/me/stats', requireAuth, profileController.getOwnStats);

export default router;
