import topicRepository from './topic.repository.js';
import subjectRepository from '../subjects/subject.repository.js';
import { slugify } from '../courses/course.service.js';
import { getPaginationParams, buildPaginatedResponse } from '../../utils/pagination.js';

/**
 * Service orchestrating topic business logic.
 */
export class TopicService {
  /**
   * Retrieves a topic by ID.
   *
   * @param {string} id
   * @returns {Promise<any>}
   */
  async getTopicById(id) {
    if (!id) {
      const error = new Error('Topic ID is required.');
      error.statusCode = 400;
      throw error;
    }

    const topic = await topicRepository.findById(id);
    if (!topic) {
      const error = new Error(`Topic with ID "${id}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    return topic;
  }

  /**
   * Creates a new topic under a parent subject.
   *
   * @param {{ subjectId: string, name: string, slug?: string, description?: string }} input
   * @returns {Promise<any>}
   */
  async createTopic(input) {
    const { subjectId, name, description } = input;

    if (!subjectId) {
      const error = new Error('Parent subject ID is required.');
      error.statusCode = 400;
      throw error;
    }

    const parentSubject = await subjectRepository.findById(subjectId);
    if (!parentSubject) {
      const error = new Error(`Parent subject with ID "${subjectId}" was not found.`);
      error.statusCode = 404;
      throw error;
    }

    if (!name || name.trim().length === 0) {
      const error = new Error('Topic name is required.');
      error.statusCode = 400;
      throw error;
    }

    const slug = slugify(input.slug || name);
    const existing = await topicRepository.findBySubjectAndSlug(subjectId, slug);
    if (existing) {
      const error = new Error(
        `A topic with slug "${slug}" already exists under subject "${parentSubject.name}".`
      );
      error.statusCode = 409;
      throw error;
    }

    return topicRepository.create({
      subjectId,
      name: name.trim(),
      slug,
      description: description?.trim() || null
    });
  }

  /**
   * Lists topics with pagination and subject filter.
   *
   * @param {{ page?: string | number, limit?: string | number, subjectId?: string }} query
   * @returns {Promise<any>}
   */
  async listTopics(query = {}) {
    const pagination = getPaginationParams(query);
    const where = {};

    if (query.subjectId) {
      where.subjectId = query.subjectId;
    }

    const [items, totalItems] = await Promise.all([
      topicRepository.findMany({
        skip: pagination.skip,
        take: pagination.take,
        where
      }),
      topicRepository.count(where)
    ]);

    return buildPaginatedResponse(items, totalItems, pagination);
  }
}

export const topicService = new TopicService();
export default topicService;
