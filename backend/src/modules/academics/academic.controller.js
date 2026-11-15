import academicService, { AcademicService } from './academic.service.js';

export class AcademicController {
  constructor(service = academicService) {
    this.service = service;
  }

  // --- UNIVERSITIES ---
  listUniversities = async (req, res, next) => {
    try {
      const data = await this.service.listUniversities(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getUniversity = async (req, res, next) => {
    try {
      const data = await this.service.getUniversityById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  createUniversity = async (req, res, next) => {
    try {
      const data = await this.service.createUniversity(req.body, req.user);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  updateUniversity = async (req, res, next) => {
    try {
      const data = await this.service.updateUniversity(req.params.id, req.body, req.user);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  deleteUniversity = async (req, res, next) => {
    try {
      const data = await this.service.deleteUniversity(req.params.id, req.user);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  // --- SCHOOLS / FACULTIES ---
  listSchools = async (req, res, next) => {
    try {
      const data = await this.service.listSchools(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getSchool = async (req, res, next) => {
    try {
      const data = await this.service.getSchoolById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  createSchool = async (req, res, next) => {
    try {
      const data = await this.service.createSchool(req.body, req.user);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  updateSchool = async (req, res, next) => {
    try {
      const data = await this.service.updateSchool(req.params.id, req.body, req.user);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  deleteSchool = async (req, res, next) => {
    try {
      const data = await this.service.deleteSchool(req.params.id, req.user);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  // --- COURSES & DYNAMIC SEMESTERS ---
  listCourses = async (req, res, next) => {
    try {
      const data = await this.service.listCourses(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getCourse = async (req, res, next) => {
    try {
      const data = await this.service.getCourseById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getCourseSemesters = async (req, res, next) => {
    try {
      const data = await this.service.getCourseSemesters(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  createCourse = async (req, res, next) => {
    try {
      const data = await this.service.createCourse(req.body, req.user);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  updateCourse = async (req, res, next) => {
    try {
      const data = await this.service.updateCourse(req.params.id, req.body, req.user);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  deleteCourse = async (req, res, next) => {
    try {
      const data = await this.service.deleteCourse(req.params.id, req.user);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  // --- SUBJECTS ---
  listSubjects = async (req, res, next) => {
    try {
      const data = await this.service.listSubjects(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getSubject = async (req, res, next) => {
    try {
      const data = await this.service.getSubjectById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  createSubject = async (req, res, next) => {
    try {
      const data = await this.service.createSubject(req.body, req.user);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  updateSubject = async (req, res, next) => {
    try {
      const data = await this.service.updateSubject(req.params.id, req.body, req.user);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  deleteSubject = async (req, res, next) => {
    try {
      const data = await this.service.deleteSubject(req.params.id, req.user);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  // --- NOTE CATEGORIES ---
  listCategories = async (req, res, next) => {
    try {
      const data = await this.service.listCategories(req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  getCategory = async (req, res, next) => {
    try {
      const data = await this.service.getCategoryById(req.params.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  createCategory = async (req, res, next) => {
    try {
      const data = await this.service.createCategory(req.body, req.user);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  updateCategory = async (req, res, next) => {
    try {
      const data = await this.service.updateCategory(req.params.id, req.body, req.user);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  deleteCategory = async (req, res, next) => {
    try {
      const data = await this.service.deleteCategory(req.params.id, req.user);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  // --- UNIFIED OVERVIEW ---
  getOverview = async (req, res, next) => {
    try {
      const data = await this.service.getUnifiedAcademicOverview();
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };
}

export const academicController = new AcademicController();
export default academicController;
