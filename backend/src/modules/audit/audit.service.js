import auditRepository, { AuditRepository } from './audit.repository.js';
import { getPaginationParams, buildPaginatedResponse } from '../../utils/pagination.js';

/**
 * Service managing audit log operations and compliance reporting.
 */
export class AuditService {
  /**
   * @param {AuditRepository} [repo=auditRepository]
   */
  constructor(repo = auditRepository) {
    this.repo = repo;
  }

  /**
   * Appends an audit log entry.
   *
   * @param {{
   *   actorId?: string,
   *   action: string,
   *   entityType: string,
   *   entityId: string,
   *   metadata?: any
   * }} params
   * @param {any} [tx]
   * @returns {Promise<any>}
   */
  async logAction(params, tx) {
    return this.repo.create(params, tx);
  }

  /**
   * Retrieves paginated audit logs for administrators.
   *
   * @param {{
   *   page?: number|string,
   *   limit?: number|string,
   *   action?: string,
   *   entityType?: string,
   *   actorId?: string
   * }} query
   * @returns {Promise<any>}
   */
  async getAuditLogs(query = {}) {
    const { page, limit, skip } = getPaginationParams(query);

    const where = {};
    if (query.action) {
      where.action = query.action;
    }
    if (query.entityType) {
      where.entityType = query.entityType;
    }
    if (query.actorId) {
      where.actorId = query.actorId;
    }

    const [logs, total] = await Promise.all([
      this.repo.findMany({ skip, take: limit, where }),
      this.repo.count(where)
    ]);

    return buildPaginatedResponse(logs, total, page, limit);
  }
}

export const auditService = new AuditService();
export default auditService;
