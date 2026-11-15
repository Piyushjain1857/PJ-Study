import auditRepository, { AuditRepository } from './audit.repository.js';
import { getPaginationParams, buildPaginatedResponse } from '../../utils/pagination.js';

const SENSITIVE_AUDIT_KEYS = new Set([
  'password',
  'currentpassword',
  'newpassword',
  'passwordhash',
  'token',
  'tokenhash',
  'refreshtoken',
  'secret',
  'authorization',
  'cookie'
]);

/**
 * Strips confidential authentication secrets before persistence in the audit trail.
 */
export function sanitizeAuditMetadata(val) {
  if (!val || typeof val !== 'object') {
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(sanitizeAuditMetadata);
  }
  const clean = {};
  for (const [k, v] of Object.entries(val)) {
    const normalized = k.toLowerCase().replace(/[_-]/g, '');
    if (SENSITIVE_AUDIT_KEYS.has(normalized)) {
      clean[k] = '[REDACTED]';
    } else if (typeof v === 'object' && v !== null) {
      clean[k] = sanitizeAuditMetadata(v);
    } else {
      clean[k] = v;
    }
  }
  return clean;
}

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
    const sanitizedParams = {
      ...params,
      metadata: params.metadata ? sanitizeAuditMetadata(params.metadata) : params.metadata
    };
    return this.repo.create(sanitizedParams, tx);
  }

  /**
   * Alias for logAction for unified logging compatibility.
   */
  async log(params, tx) {
    return this.logAction(params, tx);
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
