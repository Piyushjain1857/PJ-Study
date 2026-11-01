import prisma from '../../config/database.js';

/**
 * Repository handling database operations for Course records.
 */
export class CourseRepository {
  /**
   * Finds a course by ID.
   *
   * @param {string} id
   * @param {boolean} [includeSubjects=false]
   * @returns {Promise<any>}
   */
  async findById(id, includeSubjects = false) {
    return prisma.course.findUnique({
      where: { id },
      include: {
        subjects: includeSubjects
          ? {
              where: { isActive: true },
              orderBy: { semester: 'asc' }
            }
          : false,
        _count: {
          select: { subjects: true, notes: true }
        }
      }
    });
  }

  /**
   * Finds a course by its unique slug.
   *
   * @param {string} slug
   * @param {boolean} [includeSubjects=false]
   * @returns {Promise<any>}
   */
  async findBySlug(slug, includeSubjects = false) {
    return prisma.course.findUnique({
      where: { slug },
      include: {
        subjects: includeSubjects
          ? {
              where: { isActive: true },
              orderBy: { semester: 'asc' }
            }
          : false,
        _count: {
          select: { subjects: true, notes: true }
        }
      }
    });
  }

  /**
   * Creates a new Course.
   *
   * @param {object} data
   * @returns {Promise<any>}
   */
  async create(data) {
    return prisma.course.create({ data });
  }

  /**
   * Updates an existing Course.
   *
   * @param {string} id
   * @param {object} data
   * @returns {Promise<any>}
   */
  async update(id, data) {
    return prisma.course.update({
      where: { id },
      data
    });
  }

  /**
   * Retrieves paginated courses.
   *
   * @param {{ skip?: number, take?: number, where?: object }} options
   * @returns {Promise<any[]>}
   */
  async findMany({ skip = 0, take = 10, where = {} } = {}) {
    return prisma.course.findMany({
      where,
      skip,
      take,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { subjects: true, notes: true }
        }
      }
    });
  }

  /**
   * Counts courses matching criteria.
   *
   * @param {object} [where={}]
   * @returns {Promise<number>}
   */
  async count(where = {}) {
    return prisma.course.count({ where });
  }
}

export const courseRepository = new CourseRepository();
export default courseRepository;
