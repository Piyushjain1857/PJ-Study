import subjectService, { SubjectService } from './subject.service.js';
import subjectRepository from './subject.repository.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class SubjectController {
  constructor(service = subjectService, repo = subjectRepository) {
    this.service = service;
    this.repo = repo;
  }

  listSubjects = async (req, res, next) => {
    try {
      const { all, courseId, semester, isActive, page, limit } = req.query;

      // When called without pagination (e.g. for dropdowns) or all=true, return full active list
      if (all === 'true' || limit === 'all' || (!page && !limit)) {
        const where = {};
        if (courseId) where.courseId = courseId;
        if (semester) {
          const sem = parseInt(String(semester), 10);
          if (!Number.isNaN(sem)) where.semester = sem;
        }
        if (typeof isActive === 'boolean') {
          where.isActive = isActive;
        } else if (isActive === 'true') {
          where.isActive = true;
        } else if (isActive === 'false') {
          where.isActive = false;
        } else {
          where.isActive = true; // default active
        }

        const items = await this.repo.findMany({
          skip: 0,
          take: 200,
          where
        });
        res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
        return sendSuccess(res, items);
      }

      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      const result = await this.service.listSubjects(req.query);
      return sendSuccess(res, result);
    } catch (err) {
      return next(err);
    }
  };

  getSubjectById = async (req, res, next) => {
    try {
      const subject = await this.service.getSubjectById(req.params.id, true);
      return sendSuccess(res, subject);
    } catch (err) {
      return next(err);
    }
  };

  createSubject = async (req, res, next) => {
    try {
      const subject = await this.service.createSubject(req.body);
      return sendSuccess(res, subject, 201);
    } catch (err) {
      return next(err);
    }
  };
}

export const subjectController = new SubjectController();
export default subjectController;
