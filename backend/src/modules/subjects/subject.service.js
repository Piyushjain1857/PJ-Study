import subjectRepository from './subject.repository.js';
import courseRepository from '../courses/course.repository.js';
import { slugify } from '../courses/course.service.js';
import { getPaginationParams, buildPaginatedResponse } from '../../utils/pagination.js';

/**
 * Service orchestrating subject business logic and academic course hierarchy.
 */
export class SubjectService {
  /**
   * Retrieves subject by ID.
   *
   * @param {string} id
   * @param {boolean} [includeTopics=false]
   * @returns {Promise<any>}
   */
  async getSubjectById(id, includeTopics = false) {
    if (!id) {
      const error = new Error('Subject ID is required.');
      error.statusCode = 400;
      throw error;
    }

    const subject = await subjectRepository.findById(id, includeTopics);
    if (!subject) {
      const error = new Error(`Subject with ID "${id}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    return subject;
  }

  /**
   * Creates a subject within a parent course.
   *
   * @param {{
   *   courseId: string,
   *   name: string,
   *   slug?: string,
   *   semester: number,
   *   description?: string,
   *   isActive?: boolean
   * }} input
   * @returns {Promise<any>}
   */
  async createSubject(input) {
    const { courseId, name, semester, description, isActive = true } = input;

    if (!courseId) {
      const error = new Error('Parent course ID is required.');
      error.statusCode = 400;
      throw error;
    }

    if (!name || name.trim().length === 0) {
      const error = new Error('Subject name is required.');
      error.statusCode = 400;
      throw error;
    }

    const parsedSemester = parseInt(String(semester), 10);
    if (Number.isNaN(parsedSemester) || parsedSemester < 1 || parsedSemester > 12) {
      const error = new Error('Semester must be an integer between 1 and 12.');
      error.statusCode = 400;
      throw error;
    }

    const parentCourse = await courseRepository.findById(courseId);
    if (!parentCourse) {
      const error = new Error(`Parent course with ID "${courseId}" does not exist.`);
      error.statusCode = 404;
      throw error;
    }

    const slug = slugify(input.slug || name);
    const existing = await subjectRepository.findByCourseAndSlug(courseId, slug);
    if (existing) {
      const error = new Error(
        `A subject with slug "${slug}" already exists in course "${parentCourse.name}".`
      );
      error.statusCode = 409;
      throw error;
    }

    return subjectRepository.create({
      courseId,
      name: name.trim(),
      slug,
      semester: parsedSemester,
      description: description?.trim() || null,
      isActive
    });
  }

  /**
   * Lists subjects with pagination and course/semester filters.
   *
   * @param {{
   *   page?: string | number,
   *   limit?: string | number,
   *   courseId?: string,
   *   semester?: string | number,
   *   isActive?: boolean
   * }} query
   * @returns {Promise<any>}
   */
  async listSubjects(query = {}) {
    const pagination = getPaginationParams(query);
    const where = {};

    if (query.courseId) {
      where.courseId = query.courseId;
    }

    if (query.semester) {
      const sem = parseInt(String(query.semester), 10);
      if (!Number.isNaN(sem)) {
        where.semester = sem;
      }
    }

    if (typeof query.isActive === 'boolean') {
      where.isActive = query.isActive;
    }

    const [items, totalItems] = await Promise.all([
      subjectRepository.findMany({
        skip: pagination.skip,
        take: pagination.take,
        where
      }),
      subjectRepository.count(where)
    ]);

    return buildPaginatedResponse(items, totalItems, pagination);
  }
}

export const subjectService = new SubjectService();
export default subjectService;
