import prisma from '../../config/database.js';
import notificationRepository, { NotificationRepository } from './notification.repository.js';
import { getPaginationParams, buildPaginatedResponse } from '../../utils/pagination.js';

export const VALID_AUDIENCES = ['ALL', 'STUDENT', 'MODERATOR', 'ADMIN'];
export const VALID_PRIORITIES = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

/**
 * Service managing administrative system announcements and multi-user notification fan-out.
 */
export class AnnouncementService {
  /**
   * @param {NotificationRepository} [repo]
   */
  constructor(repo = notificationRepository) {
    this.repo = repo;
  }

  /**
   * Creates an administrative announcement and fans out notifications to target users in bounded batches.
   *
   * @param {string} adminId - ID of administrator creating the announcement
   * @param {{
   *   title: string,
   *   message: string,
   *   targetAudience?: 'ALL' | 'STUDENT' | 'MODERATOR' | 'ADMIN',
   *   targetUrl?: string,
   *   priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
   * }} data
   * @returns {Promise<{ announcement: any, recipientCount: number }>}
   */
  async createAnnouncement(adminId, data) {
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length < 3) {
      const error = new Error('Announcement title must be at least 3 characters long.');
      error.statusCode = 400;
      error.code = 'INVALID_TITLE';
      throw error;
    }

    if (!data.message || typeof data.message !== 'string' || data.message.trim().length < 5) {
      const error = new Error('Announcement message must be at least 5 characters long.');
      error.statusCode = 400;
      error.code = 'INVALID_MESSAGE';
      throw error;
    }

    const title = data.title.trim();
    const message = data.message.trim();

    // Validate target audience
    const audience = data.targetAudience?.toUpperCase() || 'ALL';
    if (!VALID_AUDIENCES.includes(audience)) {
      const error = new Error(
        `Invalid target audience "${data.targetAudience}". Must be one of: ${VALID_AUDIENCES.join(', ')}`
      );
      error.statusCode = 400;
      error.code = 'INVALID_AUDIENCE';
      throw error;
    }

    // Validate priority
    const priority = data.priority?.toUpperCase() || 'NORMAL';
    if (!VALID_PRIORITIES.includes(priority)) {
      const error = new Error(
        `Invalid priority level "${data.priority}". Must be one of: ${VALID_PRIORITIES.join(', ')}`
      );
      error.statusCode = 400;
      error.code = 'INVALID_PRIORITY';
      throw error;
    }

    // Validate destination URL safety: must be internal application route
    let sanitizedTargetUrl = null;
    if (data.targetUrl && typeof data.targetUrl === 'string') {
      const trimmed = data.targetUrl.trim();
      if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) {
        const error = new Error(
          'Target URL must be a valid internal application route starting with "/" (e.g. "/notes/explore").'
        );
        error.statusCode = 400;
        error.code = 'INVALID_TARGET_URL';
        throw error;
      }
      sanitizedTargetUrl = trimmed;
    }

    // 1. Create Announcement Record
    const announcement = await this.repo.createAnnouncement({
      createdById: adminId,
      title,
      message,
      targetAudience: audience,
      targetUrl: sanitizedTargetUrl,
      priority
    });

    // 2. Identify Target Active Users
    const userWhere = { isActive: true };
    if (audience !== 'ALL') {
      userWhere.role = audience;
    }

    // Query active recipients with preferences
    const users = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        notificationPreference: {
          select: {
            platformAnnouncements: true,
            inAppEnabled: true
          }
        }
      }
    });

    // Filter recipients based on preferences
    const eligibleUserIds = users
      .filter((u) => {
        const pref = u.notificationPreference;
        if (!pref) return true; // default enabled
        return pref.inAppEnabled !== false && pref.platformAnnouncements !== false;
      })
      .map((u) => u.id);

    // 3. Bounded Batch Fan-Out (chunks of 100)
    const BATCH_SIZE = 100;
    let recipientCount = 0;

    for (let i = 0; i < eligibleUserIds.length; i += BATCH_SIZE) {
      const chunk = eligibleUserIds.slice(i, i + BATCH_SIZE);
      const notifications = chunk.map((userId) => ({
        userId,
        type: 'SYSTEM_ANNOUNCEMENT',
        category: 'SYSTEM',
        title: `Announcement: ${title}`,
        message,
        targetUrl: sanitizedTargetUrl,
        eventKey: `announcement_${announcement.id}_${userId}`,
        metadata: {
          announcementId: announcement.id,
          priority
        }
      }));

      const res = await this.repo.createMany(notifications);
      recipientCount += res.count;
    }

    // Broadcast live activity and dispatch announcement emails asynchronously
    import('../../services/realtime/socket.service.js').then(
      ({ recordAndBroadcastActivity, broadcastEvent }) => {
        recordAndBroadcastActivity({
          type: 'ANNOUNCEMENT_NEW',
          action: 'ANNOUNCEMENT_PUBLISHED',
          title: `Announcement: ${title}`,
          description: message,
          actorId: adminId,
          actorRole: 'ADMIN',
          targetId: announcement.id,
          targetType: 'ANNOUNCEMENT',
          isPublic: true
        }).catch(() => {});
        broadcastEvent('announcement:new', announcement);
      }
    ).catch(() => {});

    import('../../services/email/email.service.js').then(({ emailService }) => {
      prisma.user.findMany({
        where: userWhere,
        take: 100,
        select: { id: true, name: true, email: true }
      }).then((recipients) => {
        for (const r of recipients) {
          emailService.sendAnnouncementEmail({
            to: r.email,
            name: r.name,
            title,
            message,
            priority,
            targetUrl: sanitizedTargetUrl,
            userId: r.id
          }).catch(() => {});
        }
      }).catch(() => {});
    }).catch(() => {});

    return {
      announcement,
      recipientCount
    };
  }

  /**
   * Retrieves paginated announcements list for administrative review.
   *
   * @param {{ page?: number | string, limit?: number | string }} query
   * @returns {Promise<any>}
   */
  async getAnnouncements(query = {}) {
    const { page, limit, skip, take } = getPaginationParams(query, 20, 50);

    const [items, total] = await Promise.all([
      this.repo.findAnnouncements({ skip, take }),
      this.repo.countAnnouncements()
    ]);

    const paginated = buildPaginatedResponse(items, total, { page, limit });
    return {
      announcements: paginated.items,
      pagination: paginated.meta
    };
  }
}

export const announcementService = new AnnouncementService();
export default announcementService;
