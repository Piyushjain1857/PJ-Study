import notificationService, { NotificationService } from './notification.service.js';
import announcementService, { AnnouncementService } from './announcement.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class NotificationController {
  /**
   * @param {NotificationService} [service]
   * @param {AnnouncementService} [announcements]
   */
  constructor(service = notificationService, announcements = announcementService) {
    this.service = service;
    this.announcements = announcements;
  }

  /**
   * Retrieves paginated notifications for the authenticated user.
   */
  getNotifications = async (req, res, next) => {
    try {
      const data = await this.service.getUserNotifications(req.user.id, req.query);
      return sendSuccess(res, data, 200);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Retrieves unread count for the authenticated user.
   */
  getUnreadCount = async (req, res, next) => {
    try {
      const data = await this.service.getUnreadCount(req.user.id);
      return sendSuccess(res, data, 200);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Marks a single notification as read.
   */
  markAsRead = async (req, res, next) => {
    try {
      const notification = await this.service.markAsRead(req.user.id, req.params.id);
      return sendSuccess(res, notification, 200, 'Notification marked as read.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Marks all unread notifications as read.
   */
  markAllAsRead = async (req, res, next) => {
    try {
      const result = await this.service.markAllAsRead(req.user.id);
      return sendSuccess(res, result, 200, 'All notifications marked as read.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Dismisses / deletes a notification.
   */
  dismissNotification = async (req, res, next) => {
    try {
      const result = await this.service.dismissNotification(req.user.id, req.params.id);
      return sendSuccess(res, result, 200);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Retrieves user's notification preferences.
   */
  getPreferences = async (req, res, next) => {
    try {
      const preferences = await this.service.getPreferences(req.user.id);
      return sendSuccess(res, preferences, 200);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Updates user's notification preferences.
   */
  updatePreferences = async (req, res, next) => {
    try {
      const updated = await this.service.updatePreferences(req.user.id, req.body);
      return sendSuccess(res, updated, 200, 'Notification preferences updated successfully.');
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Creates an administrative platform announcement and fans out notifications.
   */
  createAnnouncement = async (req, res, next) => {
    try {
      const result = await this.announcements.createAnnouncement(req.user.id, req.body);
      const msg = result.deduplicated
        ? 'Duplicate announcement detected; existing announcement retained without redundant notifications.'
        : `Platform announcement published to ${result.recipientCount} scholars.`;
      return sendSuccess(res, result, 201, msg);
    } catch (err) {
      return next(err);
    }
  };

  /**
   * Retrieves paginated past announcements for administrators.
   */
  getAnnouncements = async (req, res, next) => {
    try {
      const data = await this.announcements.getAnnouncements(req.query);
      return sendSuccess(res, data, 200);
    } catch (err) {
      return next(err);
    }
  };
}

export const notificationController = new NotificationController();
export default notificationController;
