import dashboardRepository from './dashboard.repository.js';
import { getPaginationParams, buildPaginatedResponse } from '../../utils/pagination.js';

export class DashboardService {
  constructor(repo = dashboardRepository) {
    this.repo = repo;
  }

  /**
   * Retrieves full overview dashboard data for the authenticated student.
   *
   * @param {string} userId
   */
  async getStudentOverview(userId) {
    if (!userId) {
      const error = new Error('User ID is required to fetch dashboard overview.');
      error.statusCode = 400;
      throw error;
    }

    const [
      stats,
      recentBookmarks,
      recentUploads,
      recentCollections,
      recentDownloads,
      recommendedNotes
    ] = await Promise.all([
      this.repo.getStudentCounts(userId),
      this.repo.getRecentBookmarks(userId, 5),
      this.repo.getRecentUploads(userId, 5),
      this.repo.getRecentCollections(userId, 4),
      this.repo.getRecentDownloads(userId, 5),
      this.repo.getRecommendedNotes(userId, 4)
    ]);

    return {
      stats: {
        savedNotes: stats.savedNotesCount,
        collections: stats.collectionsCount,
        downloads: stats.downloadsCount,
        uniqueNotesDownloaded: stats.uniqueNotesDownloaded,
        uploads: stats.uploadsCount
      },
      recentBookmarks,
      recentUploads,
      recentCollections,
      recentDownloads,
      recommendedNotes
    };
  }

  /**
   * Retrieves aggregated activity analytics for the student over a validated range.
   *
   * @param {string} userId
   * @param {string} range '7d' | '30d' | '90d'
   */
  async getStudentAnalytics(userId, range = '7d') {
    if (!userId) {
      const error = new Error('User ID is required to fetch analytics.');
      error.statusCode = 400;
      throw error;
    }

    const validRanges = {
      '7d': 7,
      '30d': 30,
      '90d': 90
    };

    const days = validRanges[range] || 7;
    const selectedRange = validRanges[range] ? range : '7d';

    // Calculate UTC day boundaries
    const now = new Date();
    const endDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999)
    );
    const startDate = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - (days - 1), 0, 0, 0, 0)
    );

    const timelineData = await this.repo.getActivityTimeline(userId, startDate, endDate);

    return {
      range: selectedRange,
      days,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totals: timelineData.totals,
      timeline: timelineData.timeline
    };
  }

  /**
   * Retrieves paginated download history for the student.
   *
   * @param {string} userId
   * @param {object} query
   */
  async getStudentDownloads(userId, query = {}) {
    if (!userId) {
      const error = new Error('User ID is required to fetch download history.');
      error.statusCode = 400;
      throw error;
    }

    const { page, limit, skip } = getPaginationParams(query);
    const { total, items } = await this.repo.getDownloadHistoryPaginated(userId, skip, limit);

    return buildPaginatedResponse(items, total, page, limit);
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
