import courseService, { CourseService } from './course.service.js';
import courseRepository from './course.repository.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class CourseController {
  constructor(service = courseService, repo = courseRepository) {
    this.service = service;
    this.repo = repo;
  }

  listCourses = async (req, res, next) => {
    try {
      const { all, isActive, page, limit } = req.query;

      // When called without pagination (e.g. for dropdowns) or all=true, return full active list
      if (all === 'true' || limit === 'all' || (!page && !limit)) {
        const where = {};
        if (typeof isActive === 'boolean') {
          where.isActive = isActive;
        } else if (isActive === 'true') {
          where.isActive = true;
        } else if (isActive === 'false') {
          where.isActive = false;
        } else {
          where.isActive = true; // default active
        }

        const preferredOrder = ['B.Tech', 'BCA', 'B.Sc.', 'MCA', 'M.Tech'];
        const items = await this.repo.findMany({
          skip: 0,
          take: 100,
          where
        });
        const sortedItems = [...items].sort((a, b) => {
          const idxA = preferredOrder.findIndex((p) => p.toLowerCase() === a.name.toLowerCase().trim());
          const idxB = preferredOrder.findIndex((p) => p.toLowerCase() === b.name.toLowerCase().trim());
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.name.localeCompare(b.name);
        });
        res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
        return sendSuccess(res, sortedItems);
      }

      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      const result = await this.service.listCourses(req.query);
      return sendSuccess(res, result);
    } catch (err) {
      return next(err);
    }
  };

  getCourseById = async (req, res, next) => {
    try {
      const course = await this.service.getCourseById(req.params.id, true);
      return sendSuccess(res, course);
    } catch (err) {
      return next(err);
    }
  };

  getCourseBySlug = async (req, res, next) => {
    try {
      const course = await this.service.getCourseBySlug(req.params.slug, true);
      return sendSuccess(res, course);
    } catch (err) {
      return next(err);
    }
  };

  createCourse = async (req, res, next) => {
    try {
      const course = await this.service.createCourse(req.body);
      return sendSuccess(res, course, 201);
    } catch (err) {
      return next(err);
    }
  };
}

export const courseController = new CourseController();
export default courseController;
