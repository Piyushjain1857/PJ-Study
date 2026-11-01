import courseRepository from './course.repository.js';
import { getPaginationParams, buildPaginatedResponse } from '../../utils/pagination.js';

/**
 * Generates an URL-friendly slug from an academic title.
 *
 * @param {string} text
 * @returns {string}
 */
export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s_.]+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Service orchestrating course business logic.
 */
export class CourseService {
  /**
   * Retrieves course by ID.
   *
   * @param {string} id
   * @param {boolean} [includeSubjects=false]
   * @returns {Promise<any>}
   */
  async getCourseById(id, includeSubjects = false) {
    if (!id) {
      const error = new Error('Course ID is required.');
      error.statusCode = 400;
      throw error;
    }

    const course = await courseRepository.findById(id, includeSubjects);
    if (!course) {
      const error = new Error(`Course with ID "${id}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    return course;
  }

  /**
   * Retrieves course by unique slug.
   *
   * @param {string} slug
   * @param {boolean} [includeSubjects=false]
   * @returns {Promise<any>}
   */
  async getCourseBySlug(slug, includeSubjects = false) {
    if (!slug) {
      const error = new Error('Course slug is required.');
      error.statusCode = 400;
      throw error;
    }

    const course = await courseRepository.findBySlug(slug.toLowerCase(), includeSubjects);
    if (!course) {
      const error = new Error(`Course with slug "${slug}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    return course;
  }

  /**
   * Creates a new Course with uniqueness validation.
   *
   * @param {{ name: string, slug?: string, description?: string, isActive?: boolean }} input
   * @returns {Promise<any>}
   */
  async createCourse(input) {
    const { name, description, isActive = true } = input;

    if (!name || name.trim().length === 0) {
      const error = new Error('Course name is required.');
      error.statusCode = 400;
      throw error;
    }

    const slug = slugify(input.slug || name);
    if (!slug) {
      const error = new Error('A valid slug could not be generated from course name.');
      error.statusCode = 400;
      throw error;
    }

    const existing = await courseRepository.findBySlug(slug);
    if (existing) {
      const error = new Error(`Course slug "${slug}" is already in use.`);
      error.statusCode = 409;
      throw error;
    }

    return courseRepository.create({
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      isActive
    });
  }

  /**
   * Lists courses with pagination and active state filter.
   *
   * @param {{ page?: string | number, limit?: string | number, isActive?: boolean }} query
   * @returns {Promise<any>}
   */
  async listCourses(query = {}) {
    const pagination = getPaginationParams(query);
    const where = {};

    if (typeof query.isActive === 'boolean') {
      where.isActive = query.isActive;
    } else if (query.isActive === 'true') {
      where.isActive = true;
    } else if (query.isActive === 'false') {
      where.isActive = false;
    }

    const [items, totalItems] = await Promise.all([
      courseRepository.findMany({
        skip: pagination.skip,
        take: pagination.take,
        where
      }),
      courseRepository.count(where)
    ]);

    return buildPaginatedResponse(items, totalItems, pagination);
  }
}

export const courseService = new CourseService();
export default courseService;
