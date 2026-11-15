import prisma from '../../config/database.js';

/**
 * Standard selection for Notification records.
 */
export const NOTIFICATION_SAFE_SELECT = {
  id: true,
  userId: true,
  type: true,
  category: true,
  title: true,
  message: true,
  targetUrl: true,
  isRead: true,
  readAt: true,
  eventKey: true,
  metadata: true,
  createdAt: true,
  updatedAt: true
};

/**
 * Repository handling database operations for in-app Notifications,
 * user delivery preferences, and administrative announcements.
 */
export class NotificationRepository {
  /**
   * Retrieves paginated notifications for a specific user.
   *
   * @param {string} userId
   * @param {{
   *   skip?: number,
   *   take?: number,
   *   category?: string,
   *   readStatus?: 'all' | 'unread' | 'read'
   * }} params
   * @returns {Promise<any[]>}
   */
  async findUserNotifications(userId, { skip = 0, take = 20, category, readStatus = 'all' } = {}) {
    const where = { userId };

    if (readStatus === 'unread') {
      where.isRead = false;
    } else if (readStatus === 'read') {
      where.isRead = true;
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }

    return prisma.notification.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      select: NOTIFICATION_SAFE_SELECT
    });
  }

  /**
   * Counts notifications matching user filter criteria.
   *
   * @param {string} userId
   * @param {{ category?: string, readStatus?: 'all' | 'unread' | 'read' }} params
   * @returns {Promise<number>}
   */
  async countUserNotifications(userId, { category, readStatus = 'all' } = {}) {
    const where = { userId };

    if (readStatus === 'unread') {
      where.isRead = false;
    } else if (readStatus === 'read') {
      where.isRead = true;
    }

    if (category && category !== 'ALL') {
      where.category = category;
    }

    return prisma.notification.count({ where });
  }

  /**
   * Retrieves total unread notification count for an authenticated user.
   * Highly optimized via indexed `[userId, isRead, createdAt]`.
   *
   * @param {string} userId
   * @returns {Promise<number>}
   */
  async getUnreadCount(userId) {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });
  }

  /**
   * Finds a notification by ID.
   *
   * @param {string} id
   * @returns {Promise<any>}
   */
  async findById(id) {
    return prisma.notification.findUnique({
      where: { id },
      select: NOTIFICATION_SAFE_SELECT
    });
  }

  /**
   * Finds a notification ensuring it belongs to the specified user.
   *
   * @param {string} userId
   * @param {string} id
   * @returns {Promise<any>}
   */
  async findUserById(userId, id) {
    return prisma.notification.findFirst({
      where: { id, userId },
      select: NOTIFICATION_SAFE_SELECT
    });
  }

  /**
   * Finds an existing notification by unique eventKey for deduplication.
   *
   * @param {string} eventKey
   * @param {any} [tx=prisma]
   * @returns {Promise<any>}
   */
  async findByEventKey(eventKey, tx = prisma) {
    return tx.notification.findUnique({
      where: { eventKey },
      select: NOTIFICATION_SAFE_SELECT
    });
  }

  /**
   * Creates an in-app notification record.
   *
   * @param {object} data
   * @param {any} [tx=prisma]
   * @returns {Promise<any>}
   */
  async create(data, tx = prisma) {
    return tx.notification.create({
      data,
      select: NOTIFICATION_SAFE_SELECT
    });
  }

  /**
   * Creates multiple notifications in a batch (e.g. for platform announcements).
   *
   * @param {any[]} notificationsData
   * @param {any} [tx=prisma]
   * @returns {Promise<{ count: number }>}
   */
  async createMany(notificationsData, tx = prisma) {
    return tx.notification.createMany({
      data: notificationsData,
      skipDuplicates: true
    });
  }

  /**
   * Marks a specific notification as read.
   *
   * @param {string} id
   * @param {Date} [readAt=new Date()]
   * @param {any} [tx=prisma]
   * @returns {Promise<any>}
   */
  async markAsRead(id, readAt = new Date(), tx = prisma) {
    return tx.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt
      },
      select: NOTIFICATION_SAFE_SELECT
    });
  }

  /**
   * Marks all unread notifications for a specific user as read in a single batch.
   *
   * @param {string} userId
   * @param {Date} [readAt=new Date()]
   * @param {any} [tx=prisma]
   * @returns {Promise<{ count: number }>}
   */
  async markAllAsRead(userId, readAt = new Date(), tx = prisma) {
    return tx.notification.updateMany({
      where: {
        userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt
      }
    });
  }

  /**
   * Deletes / dismisses a notification permanently.
   *
   * @param {string} id
   * @param {any} [tx=prisma]
   * @returns {Promise<any>}
   */
  async delete(id, tx = prisma) {
    return tx.notification.delete({
      where: { id }
    });
  }

  /**
   * Retrieves notification preferences for a user.
   *
   * @param {string} userId
   * @returns {Promise<any>}
   */
  async findUserPreference(userId) {
    return prisma.notificationPreference.findUnique({
      where: { userId }
    });
  }

  /**
   * Upserts notification preferences for a user.
   *
   * @param {string} userId
   * @param {object} data
   * @returns {Promise<any>}
   */
  async upsertUserPreference(userId, data) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...data
      },
      update: data
    });
  }

  /**
   * Creates an administrative announcement.
   *
   * @param {object} data
   * @param {any} [tx=prisma]
   * @returns {Promise<any>}
   */
  async createAnnouncement(data, tx = prisma) {
    return tx.announcement.create({
      data,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true }
        }
      }
    });
  }

  /**
   * Retrieves paginated announcements list.
   *
   * @param {{ skip?: number, take?: number }} params
   * @returns {Promise<any[]>}
   */
  async findAnnouncements({ skip = 0, take = 20 } = {}) {
    return prisma.announcement.findMany({
      skip,
      take,
      orderBy: { publishedAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true }
        }
      }
    });
  }

  /**
   * Counts total announcements.
   *
   * @returns {Promise<number>}
   */
  async countAnnouncements() {
    return prisma.announcement.count();
  }
}

export const notificationRepository = new NotificationRepository();
export default notificationRepository;
