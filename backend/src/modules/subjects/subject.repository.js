import prisma from '../../config/database.js';

/**
 * Repository handling database access for Subject records.
 */
export class SubjectRepository {
  /**
   * Finds a subject by ID.
   *
   * @param {string} id
   * @param {boolean} [includeTopics=false]
   * @returns {Promise<any>}
   */
  async findById(id, includeTopics = false) {
    return prisma.subject.findUnique({
      where: { id },
      include: {
        course: true,
        topics: includeTopics ? { orderBy: { name: 'asc' } } : false,
        _count: {
          select: { topics: true, notes: true }
        }
      }
    });
  }

  /**
   * Finds a subject by course ID and slug.
   *
   * @param {string} courseId
   * @param {string} slug
   * @param {boolean} [includeTopics=false]
   * @returns {Promise<any>}
   */
  async findByCourseAndSlug(courseId, slug, includeTopics = false) {
    return prisma.subject.findUnique({
      where: {
        course_subject_slug_unique: {
          courseId,
          slug
        }
      },
      include: {
        course: true,
        topics: includeTopics ? { orderBy: { name: 'asc' } } : false,
        _count: {
          select: { topics: true, notes: true }
        }
      }
    });
  }

  /**
   * Creates a new Subject.
   *
   * @param {object} data
   * @returns {Promise<any>}
   */
  async create(data) {
    return prisma.subject.create({ data });
  }

  /**
   * Updates an existing Subject.
   *
   * @param {string} id
   * @param {object} data
   * @returns {Promise<any>}
   */
  async update(id, data) {
    return prisma.subject.update({
      where: { id },
      data
    });
  }

  /**
   * Retrieves paginated subjects.
   *
   * @param {{ skip?: number, take?: number, where?: object }} options
   * @returns {Promise<any[]>}
   */
  async findMany({ skip = 0, take = 10, where = {} } = {}) {
    return prisma.subject.findMany({
      where,
      skip,
      take,
      orderBy: [{ semester: 'asc' }, { name: 'asc' }],
      include: {
        course: { select: { id: true, name: true, slug: true } },
        _count: {
          select: { topics: true, notes: true }
        }
      }
    });
  }

  /**
   * Counts subjects matching query criteria.
   *
   * @param {object} [where={}]
   * @returns {Promise<number>}
   */
  async count(where = {}) {
    return prisma.subject.count({ where });
  }
}

export const subjectRepository = new SubjectRepository();
export default subjectRepository;
