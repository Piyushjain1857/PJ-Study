import prisma from '../../config/database.js';

/**
 * Repository handling database access for Topic records.
 */
export class TopicRepository {
  /**
   * Finds a topic by ID.
   *
   * @param {string} id
   * @returns {Promise<any>}
   */
  async findById(id) {
    return prisma.topic.findUnique({
      where: { id },
      include: {
        subject: {
          include: { course: true }
        },
        _count: {
          select: { notes: true }
        }
      }
    });
  }

  /**
   * Finds a topic by subject ID and unique slug.
   *
   * @param {string} subjectId
   * @param {string} slug
   * @returns {Promise<any>}
   */
  async findBySubjectAndSlug(subjectId, slug) {
    return prisma.topic.findUnique({
      where: {
        subject_topic_slug_unique: {
          subjectId,
          slug
        }
      }
    });
  }

  /**
   * Creates a new Topic.
   *
   * @param {object} data
   * @returns {Promise<any>}
   */
  async create(data) {
    return prisma.topic.create({ data });
  }

  /**
   * Updates an existing Topic.
   *
   * @param {string} id
   * @param {object} data
   * @returns {Promise<any>}
   */
  async update(id, data) {
    return prisma.topic.update({
      where: { id },
      data
    });
  }

  /**
   * Retrieves paginated topics.
   *
   * @param {{ skip?: number, take?: number, where?: object }} options
   * @returns {Promise<any[]>}
   */
  async findMany({ skip = 0, take = 10, where = {} } = {}) {
    return prisma.topic.findMany({
      where,
      skip,
      take,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { notes: true }
        }
      }
    });
  }

  /**
   * Counts topics matching query criteria.
   *
   * @param {object} [where={}]
   * @returns {Promise<number>}
   */
  async count(where = {}) {
    return prisma.topic.count({ where });
  }
}

export const topicRepository = new TopicRepository();
export default topicRepository;
