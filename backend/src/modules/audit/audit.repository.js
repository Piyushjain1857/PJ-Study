import prisma from '../../config/database.js';

export const AUDIT_ACTOR_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true
};

/**
 * Repository managing persistence and retrieval of security and administrative audit logs.
 */
export class AuditRepository {
  /**
   * Appends an audit log entry.
   *
   * @param {{
   *   actorId?: string,
   *   action: string,
   *   entityType: string,
   *   entityId: string,
   *   metadata?: any
   * }} data
   * @param {any} [tx] - Optional Prisma transaction client
   * @returns {Promise<any>}
   */
  async create(data, tx = prisma) {
    return tx.auditLog.create({
      data: {
        actorId: data.actorId || null,
        action: data.action,
        entityType: data.entityType,
        entityId: String(data.entityId),
        metadata: data.metadata || null
      },
      include: {
        actor: {
          select: AUDIT_ACTOR_SELECT
        }
      }
    });
  }

  /**
   * Retrieves paginated audit logs with optional filtering.
   *
   * @param {{
   *   skip?: number,
   *   take?: number,
   *   where?: object,
   *   orderBy?: object
   * }} options
   * @returns {Promise<any[]>}
   */
  async findMany({ skip = 0, take = 20, where = {}, orderBy = { createdAt: 'desc' } } = {}) {
    return prisma.auditLog.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        actor: {
          select: AUDIT_ACTOR_SELECT
        }
      }
    });
  }

  /**
   * Counts audit log records matching filter conditions.
   *
   * @param {object} [where={}]
   * @returns {Promise<number>}
   */
  async count(where = {}) {
    return prisma.auditLog.count({ where });
  }
}

export const auditRepository = new AuditRepository();
export default auditRepository;
