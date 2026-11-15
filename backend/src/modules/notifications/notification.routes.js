import { Router } from 'express';
import notificationController from './notification.controller.js';
import { requireAuth } from '../../auth/requireAuth.js';
import {
  validateNotificationQuery,
  validateNotificationId,
  validateUpdatePreferences
} from './notification.validation.js';

const router = Router();

// All personal notification routes require authentication
router.use(requireAuth);

// Notification retrieval & unread count
router.get('/', validateNotificationQuery, notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);

// Bulk actions
router.patch('/read-all', notificationController.markAllAsRead);

// Individual notification actions
router.patch('/:id/read', validateNotificationId, notificationController.markAsRead);
router.delete('/:id', validateNotificationId, notificationController.dismissNotification);

// User notification delivery preferences
router.get('/preferences', notificationController.getPreferences);
router.patch('/preferences', validateUpdatePreferences, notificationController.updatePreferences);

export default router;
