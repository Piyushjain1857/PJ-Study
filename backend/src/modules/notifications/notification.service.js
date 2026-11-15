import notificationRepository, { NotificationRepository } from './notification.repository.js';
import { getPaginationParams, buildPaginatedResponse } from '../../utils/pagination.js';

export const VALID_CATEGORIES = ['ACADEMIC', 'REVIEWS', 'COMMUNITY', 'SYSTEM', 'SECURITY'];

/**
 * Service managing in-app notifications, user preferences, and activity delivery.
 */
export class NotificationService {
  /**
   * @param {NotificationRepository} [repo]
   */
  constructor(repo = notificationRepository) {
    this.repo = repo;
  }

  /**
   * Retrieves paginated notifications with filters for read status and categories.
   *
   * @param {string} userId
   * @param {{
   *   page?: number | string,
   *   limit?: number | string,
   *   status?: 'all' | 'unread' | 'read',
   *   category?: string
   * }} query
   * @returns {Promise<any>}
   */
  async getUserNotifications(userId, query = {}) {
    const { page, limit, skip, take } = getPaginationParams(query, 20, 50);

    const readStatus = ['unread', 'read'].includes(query.status) ? query.status : 'all';
    let category = query.category?.trim().toUpperCase();
    if (!VALID_CATEGORIES.includes(category)) {
      category = undefined;
    }

    const [items, total, unreadCount] = await Promise.all([
      this.repo.findUserNotifications(userId, {
        skip,
        take,
        category,
        readStatus
      }),
      this.repo.countUserNotifications(userId, {
        category,
        readStatus
      }),
      this.repo.getUnreadCount(userId)
    ]);

    const paginated = buildPaginatedResponse(items, total, { page, limit });
    return {
      notifications: paginated.items,
      unreadCount,
      pagination: paginated.meta
    };
  }

  /**
   * Retrieves unread notification count for an authenticated user.
   *
   * @param {string} userId
   * @returns {Promise<{ unreadCount: number }>}
   */
  async getUnreadCount(userId) {
    const unreadCount = await this.repo.getUnreadCount(userId);
    return { unreadCount };
  }

  /**
   * Marks a specific notification as read, enforcing strict ownership.
   *
   * @param {string} userId
   * @param {string} notificationId
   * @returns {Promise<any>}
   */
  async markAsRead(userId, notificationId) {
    const notification = await this.repo.findById(notificationId);
    if (!notification) {
      const error = new Error(`Notification with ID "${notificationId}" was not found.`);
      error.statusCode = 404;
      error.code = 'NOTIFICATION_NOT_FOUND';
      throw error;
    }

    // Ownership check: Prevent cross-user modification
    if (notification.userId !== userId) {
      const error = new Error('You do not have permission to modify this notification.');
      error.statusCode = 403;
      error.code = 'NOTIFICATION_FORBIDDEN';
      throw error;
    }

    // Idempotent: If already read, return existing record directly
    if (notification.isRead) {
      return notification;
    }

    return this.repo.markAsRead(notificationId);
  }

  /**
   * Marks all unread notifications for a user as read in a single batch.
   *
   * @param {string} userId
   * @returns {Promise<{ updatedCount: number }>}
   */
  async markAllAsRead(userId) {
    const result = await this.repo.markAllAsRead(userId);
    return { updatedCount: result.count };
  }

  /**
   * Dismisses / deletes a notification, enforcing strict ownership.
   *
   * @param {string} userId
   * @param {string} notificationId
   * @returns {Promise<{ message: string }>}
   */
  async dismissNotification(userId, notificationId) {
    const notification = await this.repo.findById(notificationId);
    if (!notification) {
      const error = new Error(`Notification with ID "${notificationId}" was not found.`);
      error.statusCode = 404;
      error.code = 'NOTIFICATION_NOT_FOUND';
      throw error;
    }

    // Ownership check
    if (notification.userId !== userId) {
      const error = new Error('You do not have permission to delete this notification.');
      error.statusCode = 403;
      error.code = 'NOTIFICATION_FORBIDDEN';
      throw error;
    }

    await this.repo.delete(notificationId);
    return { message: 'Notification dismissed successfully.' };
  }

  /**
   * Retrieves notification delivery preferences for a user with sensible defaults.
   *
   * @param {string} userId
   * @returns {Promise<any>}
   */
  async getPreferences(userId) {
    const pref = await this.repo.findUserPreference(userId);
    if (!pref) {
      return {
        userId,
        noteModeration: true,
        reviewActivity: true,
        helpfulVotes: true,
        platformAnnouncements: true,
        inAppEnabled: true
      };
    }
    return pref;
  }

  /**
   * Updates notification preferences for a user.
   *
   * @param {string} userId
   * @param {object} data
   * @returns {Promise<any>}
   */
  async updatePreferences(userId, data) {
    const payload = {};
    if (typeof data.noteModeration === 'boolean') payload.noteModeration = data.noteModeration;
    if (typeof data.reviewActivity === 'boolean') payload.reviewActivity = data.reviewActivity;
    if (typeof data.helpfulVotes === 'boolean') payload.helpfulVotes = data.helpfulVotes;
    if (typeof data.platformAnnouncements === 'boolean') {
      payload.platformAnnouncements = data.platformAnnouncements;
    }
    if (typeof data.inAppEnabled === 'boolean') payload.inAppEnabled = data.inAppEnabled;

    return this.repo.upsertUserPreference(userId, payload);
  }

  /**
   * Creates a notification from a genuine application event with deduplication and preference checks.
   *
   * @param {{
   *   userId: string,
   *   type: string,
   *   category?: 'ACADEMIC' | 'REVIEWS' | 'COMMUNITY' | 'SYSTEM' | 'SECURITY',
   *   title: string,
   *   message: string,
   *   targetUrl?: string,
   *   eventKey?: string,
   *   metadata?: any
   * }} params
   * @param {any} [tx]
   * @returns {Promise<any | null>} Returns created notification or null if opted out
   */
  async createNotification(
    {
      userId,
      type,
      category = 'ACADEMIC',
      title,
      message,
      targetUrl = null,
      eventKey = null,
      metadata = null
    },
    tx
  ) {
    if (!userId || !type || !title || !message) {
      return null;
    }

    // 1. Check Event Deduplication
    if (eventKey) {
      const existing = await this.repo.findByEventKey(eventKey, tx);
      if (existing) {
        return existing;
      }
    }

    // 2. Validate Target URL safety if present (prevent open redirects / XSS vectors)
    let sanitizedTargetUrl = null;
    if (targetUrl && typeof targetUrl === 'string') {
      const trimmed = targetUrl.trim();
      if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('\\')) {
        sanitizedTargetUrl = trimmed;
      }
    }

    // 3. Check User Delivery Preferences
    // Security & account critical alerts bypass non-mandatory preferences
    if (category !== 'SECURITY') {
      const pref = await this.getPreferences(userId);
      if (!pref.inAppEnabled) {
        return null; // Global in-app notifications disabled
      }

      if (category === 'ACADEMIC' && pref.noteModeration === false) {
        return null;
      }
      if (category === 'REVIEWS' && pref.reviewActivity === false) {
        return null;
      }
      if (category === 'COMMUNITY' && pref.helpfulVotes === false) {
        return null;
      }
      if (category === 'SYSTEM' && pref.platformAnnouncements === false) {
        return null;
      }
    }

    // 4. Create Notification
    try {
      return await this.repo.create(
        {
          userId,
          type,
          category,
          title,
          message,
          targetUrl: sanitizedTargetUrl,
          eventKey,
          metadata
        },
        tx
      );
    } catch (err) {
      // If unique eventKey collision occurred concurrently, fetch and return existing
      if (err.code === 'P2002' && eventKey) {
        return this.repo.findByEventKey(eventKey, tx);
      }
      throw err;
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
