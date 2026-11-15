import prisma from '../../config/database.js';
import academicRepository from './academic.repository.js';
import { slugify } from '../courses/course.service.js';
import auditService from '../audit/audit.service.js';

export class AcademicService {
  constructor(repo = academicRepository, auditSvc = auditService) {
    this.repo = repo;
    this.auditSvc = auditSvc;
  }

  /**
   * Ensure default university (K.R. Mangalam University) exists.
   */
  async ensureDefaultUniversity() {
    let krmu = await prisma.university.findFirst({
      where: {
        OR: [
          { code: 'KRMU' },
          { slug: 'krmu' },
          { name: { contains: 'Mangalam' } }
        ]
      }
    });

    if (!krmu) {
      krmu = await prisma.university.create({
        data: {
          name: 'K.R. Mangalam University',
          slug: 'krmu',
          shortName: 'KRMU',
          code: 'KRMU',
          website: 'https://www.krmangalam.edu.in',
          description: 'K.R. Mangalam University — Premier higher education campus with world-class academic curriculum and research programs in Gurugram, India.',
          isActive: true
        }
      });
    }

    return krmu;
  }

  /**
   * --- UNIVERSITIES ---
   */
  async listUniversities(query = {}) {
    return this.repo.getUniversities(query);
  }

  async getUniversityById(id) {
    const uni = await this.repo.findUniversityById(id);
    if (!uni) {
      const err = new Error('University not found.');
      err.statusCode = 404;
      throw err;
    }
    return uni;
  }

  async createUniversity(data, actor) {
    const rawName = data.name ? data.name.trim() : '';
    if (!rawName || rawName.length < 2) {
      const err = new Error('University name must be at least 2 characters long.');
      err.statusCode = 422;
      throw err;
    }

    const slug = slugify(data.slug || rawName);
    const existingSlug = await this.repo.findUniversityBySlug(slug);
    if (existingSlug) {
      const err = new Error(`A university with name/slug "${slug}" already exists.`);
      err.statusCode = 409;
      throw err;
    }

    // Check case-insensitive duplicate name
    const existingName = await prisma.university.findFirst({
      where: { name: { equals: rawName } }
    });
    if (existingName) {
      const err = new Error(`University "${rawName}" already exists.`);
      err.statusCode = 409;
      throw err;
    }

    // Check code uniqueness if provided
    if (data.code && data.code.trim()) {
      const code = data.code.trim().toUpperCase();
      const existingCode = await prisma.university.findUnique({ where: { code } });
      if (existingCode) {
        const err = new Error(`University code "${code}" is already in use.`);
        err.statusCode = 409;
        throw err;
      }
      data.code = code;
    }

    const university = await this.repo.createUniversity({
      name: rawName,
      slug,
      shortName: data.shortName?.trim() || null,
      code: data.code || null,
      description: data.description?.trim() || null,
      website: data.website?.trim() || null,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
    });

    await this.auditSvc.log({
      actorId: actor?.id,
      action: 'UNIVERSITY_CREATED',
      entityType: 'UNIVERSITY',
      entityId: university.id,
      metadata: { name: university.name, code: university.code }
    });

    return university;
  }

  async updateUniversity(id, data, actor) {
    const university = await this.repo.findUniversityById(id);
    if (!university) {
      const err = new Error('University not found.');
      err.statusCode = 404;
      throw err;
    }

    const updateData = {};
    if (data.name !== undefined) {
      const trimmed = data.name.trim();
      if (trimmed.length < 2) {
        const err = new Error('University name must be at least 2 characters.');
        err.statusCode = 422;
        throw err;
      }
      // Check duplicate
      const duplicate = await prisma.university.findFirst({
        where: { name: { equals: trimmed }, NOT: { id } }
      });
      if (duplicate) {
        const err = new Error(`Another university with name "${trimmed}" already exists.`);
        err.statusCode = 409;
        throw err;
      }
      updateData.name = trimmed;
      if (!data.slug) updateData.slug = slugify(trimmed);
    }

    if (data.slug) updateData.slug = slugify(data.slug);
    if (data.shortName !== undefined) updateData.shortName = data.shortName?.trim() || null;
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.website !== undefined) updateData.website = data.website?.trim() || null;
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);

    if (data.code !== undefined) {
      const code = data.code?.trim() ? data.code.trim().toUpperCase() : null;
      if (code) {
        const duplicateCode = await prisma.university.findFirst({
          where: { code, NOT: { id } }
        });
        if (duplicateCode) {
          const err = new Error(`University code "${code}" is already in use.`);
          err.statusCode = 409;
          throw err;
        }
      }
      updateData.code = code;
    }

    const updated = await this.repo.updateUniversity(id, updateData);

    await this.auditSvc.log({
      actorId: actor?.id,
      action: 'UNIVERSITY_UPDATED',
      entityType: 'UNIVERSITY',
      entityId: id,
      metadata: updateData
    });

    return updated;
  }

  async deleteUniversity(id, actor) {
    const university = await this.repo.findUniversityById(id);
    if (!university) {
      const err = new Error('University not found.');
      err.statusCode = 404;
      throw err;
    }

    // Referential integrity protection: check children
    const [schoolsCount, coursesCount, notesCount, usersCount] = await Promise.all([
      prisma.school.count({ where: { universityId: id } }),
      prisma.course.count({ where: { universityId: id } }),
      prisma.note.count({ where: { universityId: id } }),
      prisma.user.count({ where: { universityId: id } })
    ]);

    if (schoolsCount > 0 || coursesCount > 0 || notesCount > 0 || usersCount > 0) {
      const err = new Error(
        `Cannot delete university "${university.name}" because it has active associations (${schoolsCount} schools, ${coursesCount} courses, ${notesCount} notes, ${usersCount} scholars). Please deactivate it instead.`
      );
      err.statusCode = 400;
      err.code = 'REFERENTIAL_INTEGRITY_VIOLATION';
      throw err;
    }

    await this.repo.deleteUniversity(id);

    await this.auditSvc.log({
      actorId: actor?.id,
      action: 'UNIVERSITY_DELETED',
      entityType: 'UNIVERSITY',
      entityId: id,
      metadata: { name: university.name }
    });

    return { success: true, message: `University "${university.name}" deleted successfully.` };
  }

  /**
   * --- SCHOOLS / FACULTIES ---
   */
  async listSchools(query = {}) {
    return this.repo.getSchools(query);
  }

  async getSchoolById(id) {
    const school = await this.repo.findSchoolById(id);
    if (!school) {
      const err = new Error('School / Faculty not found.');
      err.statusCode = 404;
      throw err;
    }
    return school;
  }

  async createSchool(data, actor) {
    if (!data.universityId) {
      const defaultUni = await this.ensureDefaultUniversity();
      data.universityId = defaultUni.id;
    }

    const university = await this.repo.findUniversityById(data.universityId);
    if (!university) {
      const err = new Error('Selected university does not exist.');
      err.statusCode = 404;
      throw err;
    }

    const rawName = data.name ? data.name.trim() : '';
    if (!rawName || rawName.length < 2) {
      const err = new Error('School/Faculty name must be at least 2 characters long.');
      err.statusCode = 422;
      throw err;
    }

    const slug = slugify(data.slug || rawName);
    const existing = await prisma.school.findFirst({
      where: { universityId: data.universityId, slug }
    });
    if (existing) {
      const err = new Error(
        `A school with slug "${slug}" already exists in this university.`
      );
      err.statusCode = 409;
      throw err;
    }

    const school = await this.repo.createSchool({
      universityId: data.universityId,
      name: rawName,
      slug,
      code: data.code?.trim().toUpperCase() || null,
      description: data.description?.trim() || null,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
    });

    await this.auditSvc.log({
      actorId: actor?.id,
      action: 'SCHOOL_CREATED',
      entityType: 'SCHOOL',
      entityId: school.id,
      metadata: { name: school.name, universityId: school.universityId }
    });

    return school;
  }

  async updateSchool(id, data, actor) {
    const school = await this.repo.findSchoolById(id);
    if (!school) {
      const err = new Error('School / Faculty not found.');
      err.statusCode = 404;
      throw err;
    }

    const updateData = {};
    if (data.name !== undefined) {
      const trimmed = data.name.trim();
      if (trimmed.length < 2) {
        const err = new Error('School name must be at least 2 characters.');
        err.statusCode = 422;
        throw err;
      }
      updateData.name = trimmed;
      if (!data.slug) updateData.slug = slugify(trimmed);
    }

    if (data.slug) updateData.slug = slugify(data.slug);
    if (data.code !== undefined) updateData.code = data.code?.trim().toUpperCase() || null;
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);

    const updated = await this.repo.updateSchool(id, updateData);

    await this.auditSvc.log({
      actorId: actor?.id,
      action: 'SCHOOL_UPDATED',
      entityType: 'SCHOOL',
      entityId: id,
      metadata: updateData
    });

    return updated;
  }

  async deleteSchool(id, actor) {
    const school = await this.repo.findSchoolById(id);
    if (!school) {
      const err = new Error('School not found.');
      err.statusCode = 404;
      throw err;
    }

    const [coursesCount, notesCount] = await Promise.all([
      prisma.course.count({ where: { schoolId: id } }),
      prisma.note.count({ where: { schoolId: id } })
    ]);

    if (coursesCount > 0 || notesCount > 0) {
      const err = new Error(
        `Cannot delete school "${school.name}" because it has active courses (${coursesCount}) or notes (${notesCount}). Please deactivate it instead.`
      );
      err.statusCode = 400;
      err.code = 'REFERENTIAL_INTEGRITY_VIOLATION';
      throw err;
    }

    await this.repo.deleteSchool(id);

    await this.auditSvc.log({
      actorId: actor?.id,
      action: 'SCHOOL_DELETED',
      entityType: 'SCHOOL',
      entityId: id,
      metadata: { name: school.name }
    });

    return { success: true, message: `School "${school.name}" deleted successfully.` };
  }

  /**
   * --- COURSES & DYNAMIC SEMESTERS ---
   */
  async listCourses(query = {}) {
    return this.repo.getCourses(query);
  }

  async getCourseById(id) {
    const course = await this.repo.findCourseById(id);
    if (!course) {
      const err = new Error('Course not found.');
      err.statusCode = 404;
      throw err;
    }
    return course;
  }

  /**
   * Dynamic Semester Architecture
   * Returns valid semester options (e.g. 1..N) and subject counts for the selected course.
   */
  async getCourseSemesters(courseId) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        subjects: {
          where: { isActive: true },
          select: { id: true, name: true, semester: true }
        }
      }
    });

    if (!course) {
      const err = new Error('Course not found.');
      err.statusCode = 404;
      throw err;
    }

    const count = course.semestersCount || 8;
    const semesters = Array.from({ length: count }, (_, i) => i + 1);

    // Subject breakdown per semester
    const subjectCounts = {};
    for (const sem of semesters) {
      subjectCounts[sem] = 0;
    }
    for (const subj of course.subjects) {
      if (subj.semester) {
        subjectCounts[subj.semester] = (subjectCounts[subj.semester] || 0) + 1;
      }
    }

    return {
      courseId: course.id,
      courseName: course.name,
      degreeLevel: course.degreeLevel,
      semestersCount: count,
      semesters,
      subjectCounts
    };
  }

  async createCourse(data, actor) {
    const rawName = data.name ? data.name.trim() : '';
    if (!rawName || rawName.length < 2) {
      const err = new Error('Course name must be at least 2 characters long.');
      err.statusCode = 422;
      throw err;
    }

    const slug = slugify(data.slug || rawName);
    const existing = await prisma.course.findUnique({ where: { slug } });
    if (existing) {
      const err = new Error(`A course with slug "${slug}" already exists.`);
      err.statusCode = 409;
      throw err;
    }

    // Validate semesters count (between 1 and 12, default 8)
    let semestersCount = 8;
    if (data.semestersCount !== undefined && data.semestersCount !== null) {
      semestersCount = Number(data.semestersCount);
      if (isNaN(semestersCount) || semestersCount < 1 || semestersCount > 12) {
        const err = new Error('Course semester count must be an integer between 1 and 12.');
        err.statusCode = 422;
        throw err;
      }
    }

    // Validate or default university
    if (data.universityId) {
      const uni = await prisma.university.findUnique({ where: { id: data.universityId } });
      if (!uni) {
        const err = new Error('Selected university not found.');
        err.statusCode = 404;
        throw err;
      }
    } else {
      if (data.schoolId) {
        const school = await prisma.school.findUnique({ where: { id: data.schoolId } });
        if (school?.universityId) data.universityId = school.universityId;
      }
      if (!data.universityId) {
        const defaultUni = await this.ensureDefaultUniversity();
        data.universityId = defaultUni.id;
      }
    }

    // Validate school if provided
    if (data.schoolId) {
      const school = await prisma.school.findUnique({ where: { id: data.schoolId } });
      if (!school) {
        const err = new Error('Selected school not found.');
        err.statusCode = 404;
        throw err;
      }
    }

    const course = await this.repo.createCourse({
      name: rawName,
      slug,
      code: data.code?.trim().toUpperCase() || null,
      degreeLevel: data.degreeLevel?.trim() || 'Undergraduate',
      semestersCount,
      universityId: data.universityId || null,
      schoolId: data.schoolId || null,
      description: data.description?.trim() || null,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
    });

    await this.auditSvc.log({
      actorId: actor?.id,
      action: 'COURSE_CREATED',
      entityType: 'COURSE',
      entityId: course.id,
      metadata: { name: course.name, semestersCount: course.semestersCount }
    });

    return course;
  }

  async updateCourse(id, data, actor) {
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      const err = new Error('Course not found.');
      err.statusCode = 404;
      throw err;
    }

    const updateData = {};
    if (data.name !== undefined) {
      const trimmed = data.name.trim();
      if (trimmed.length < 2) {
        const err = new Error('Course name must be at least 2 characters.');
        err.statusCode = 422;
        throw err;
      }
      updateData.name = trimmed;
      if (!data.slug) updateData.slug = slugify(trimmed);
    }

    if (data.slug) updateData.slug = slugify(data.slug);
    if (data.code !== undefined) updateData.code = data.code?.trim().toUpperCase() || null;
    if (data.degreeLevel !== undefined) updateData.degreeLevel = data.degreeLevel?.trim() || null;
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);
    if (data.universityId !== undefined) updateData.universityId = data.universityId || null;
    if (data.schoolId !== undefined) updateData.schoolId = data.schoolId || null;

    if (data.semestersCount !== undefined && data.semestersCount !== null) {
      const sCount = Number(data.semestersCount);
      if (isNaN(sCount) || sCount < 1 || sCount > 12) {
        const err = new Error('Course semester count must be between 1 and 12.');
        err.statusCode = 422;
        throw err;
      }
      // Safety check: ensure no active subjects are orphaned beyond new semester count
      const outOfBoundsSubjects = await prisma.subject.count({
        where: { courseId: id, semester: { gt: sCount } }
      });
      if (outOfBoundsSubjects > 0) {
        const err = new Error(
          `Cannot reduce semesters to ${sCount} because ${outOfBoundsSubjects} subjects exist in higher semesters. Reassign or delete those subjects first.`
        );
        err.statusCode = 400;
        err.code = 'ORPHAN_SUBJECTS_PREVENTED';
        throw err;
      }
      updateData.semestersCount = sCount;
    }

    const updated = await this.repo.updateCourse(id, updateData);

    await this.auditSvc.log({
      actorId: actor?.id,
      action: 'COURSE_UPDATED',
      entityType: 'COURSE',
      entityId: id,
      metadata: updateData
    });

    return updated;
  }

  async deleteCourse(id, actor) {
    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      const err = new Error('Course not found.');
      err.statusCode = 404;
      throw err;
    }

    const [subjectsCount, notesCount, usersCount] = await Promise.all([
      prisma.subject.count({ where: { courseId: id } }),
      prisma.note.count({ where: { courseId: id } }),
      prisma.user.count({ where: { courseId: id } })
    ]);

    if (subjectsCount > 0 || notesCount > 0 || usersCount > 0) {
      const err = new Error(
        `Cannot delete course "${course.name}" because it has associated subjects (${subjectsCount}), notes (${notesCount}), or scholars (${usersCount}). Please deactivate it instead.`
      );
      err.statusCode = 400;
      err.code = 'REFERENTIAL_INTEGRITY_VIOLATION';
      throw err;
    }

    await this.repo.deleteCourse(id);

    await this.auditSvc.log({
      actorId: actor?.id,
      action: 'COURSE_DELETED',
      entityType: 'COURSE',
      entityId: id,
      metadata: { name: course.name }
    });

    return { success: true, message: `Course "${course.name}" deleted successfully.` };
  }

  /**
   * --- SUBJECTS ---
   */
  async listSubjects(query = {}) {
    return this.repo.getSubjects(query);
  }

  async getSubjectById(id) {
    const subject = await this.repo.findSubjectById(id);
    if (!subject) {
      const err = new Error('Subject not found.');
      err.statusCode = 404;
      throw err;
    }
    return subject;
  }

  async createSubject(data, actor) {
    if (!data.courseId) {
      const err = new Error('Course ID is required.');
      err.statusCode = 422;
      throw err;
    }

    const course = await prisma.course.findUnique({ where: { id: data.courseId } });
    if (!course) {
      const err = new Error('Selected course does not exist.');
      err.statusCode = 404;
      throw err;
    }

    const rawName = data.name ? data.name.trim() : '';
    if (!rawName || rawName.length < 2) {
      const err = new Error('Subject name must be at least 2 characters.');
      err.statusCode = 422;
      throw err;
    }

    const semester = Number(data.semester);
    if (!semester || isNaN(semester) || semester < 1 || semester > course.semestersCount) {
      const err = new Error(
        `Semester must be between 1 and ${course.semestersCount} for ${course.name}.`
      );
      err.statusCode = 422;
      throw err;
    }

    const slug = slugify(data.slug || rawName);
    const existing = await prisma.subject.findFirst({
      where: { courseId: data.courseId, slug }
    });
    if (existing) {
      const err = new Error(
        `A subject with name/slug "${slug}" already exists for this course.`
      );
      err.statusCode = 409;
      throw err;
    }

    const subject = await this.repo.createSubject({
      courseId: data.courseId,
      name: rawName,
      slug,
      code: data.code?.trim().toUpperCase() || null,
      semester,
      credits: data.credits ? Number(data.credits) : 3,
      description: data.description?.trim() || null,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
    });

    await this.auditSvc.log({
      actorId: actor?.id,
      action: 'SUBJECT_CREATED',
      entityType: 'SUBJECT',
      entityId: subject.id,
      metadata: { name: subject.name, courseId: subject.courseId, semester }
    });

    return subject;
  }

  async updateSubject(id, data, actor) {
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: { course: true }
    });
    if (!subject) {
      const err = new Error('Subject not found.');
      err.statusCode = 404;
      throw err;
    }

    const updateData = {};
    if (data.name !== undefined) {
      const trimmed = data.name.trim();
      if (trimmed.length < 2) {
        const err = new Error('Subject name must be at least 2 characters.');
        err.statusCode = 422;
        throw err;
      }
      updateData.name = trimmed;
      if (!data.slug) updateData.slug = slugify(trimmed);
    }

    if (data.slug) updateData.slug = slugify(data.slug);
    if (data.code !== undefined) updateData.code = data.code?.trim().toUpperCase() || null;
    if (data.credits !== undefined) updateData.credits = Number(data.credits);
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);

    if (data.semester !== undefined) {
      const sem = Number(data.semester);
      const maxSem = subject.course.semestersCount || 8;
      if (isNaN(sem) || sem < 1 || sem > maxSem) {
        const err = new Error(
          `Semester must be between 1 and ${maxSem} for ${subject.course.name}.`
        );
        err.statusCode = 422;
        throw err;
      }
      updateData.semester = sem;
    }

    const updated = await this.repo.updateSubject(id, updateData);

    await this.auditSvc.log({
      actorId: actor?.id,
      action: 'SUBJECT_UPDATED',
      entityType: 'SUBJECT',
      entityId: id,
      metadata: updateData
    });

    return updated;
  }

  async deleteSubject(id, actor) {
    const subject = await prisma.subject.findUnique({ where: { id } });
    if (!subject) {
      const err = new Error('Subject not found.');
      err.statusCode = 404;
      throw err;
    }

    const notesCount = await prisma.note.count({ where: { subjectId: id } });
    if (notesCount > 0) {
      const err = new Error(
        `Cannot delete subject "${subject.name}" because it contains ${notesCount} study notes. Please deactivate it instead.`
      );
      err.statusCode = 400;
      err.code = 'REFERENTIAL_INTEGRITY_VIOLATION';
      throw err;
    }

    await this.repo.deleteSubject(id);

    await this.auditSvc.log({
      actorId: actor?.id,
      action: 'SUBJECT_DELETED',
      entityType: 'SUBJECT',
      entityId: id,
      metadata: { name: subject.name }
    });

    return { success: true, message: `Subject "${subject.name}" deleted successfully.` };
  }

  /**
   * --- NOTE CATEGORIES ---
   */
  async listCategories(query = {}) {
    return this.repo.getCategories(query);
  }

  async getCategoryById(id) {
    const category = await this.repo.findCategoryById(id);
    if (!category) {
      const err = new Error('Category not found.');
      err.statusCode = 404;
      throw err;
    }
    return category;
  }

  async createCategory(data, actor) {
    const rawName = data.name ? data.name.trim() : '';
    if (!rawName || rawName.length < 2) {
      const err = new Error('Category name must be at least 2 characters.');
      err.statusCode = 422;
      throw err;
    }

    const slug = slugify(data.slug || rawName);
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      const err = new Error(`Category with slug "${slug}" already exists.`);
      err.statusCode = 409;
      throw err;
    }

    const category = await this.repo.createCategory({
      name: rawName,
      slug,
      description: data.description?.trim() || null,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
    });

    await this.auditSvc.log({
      actorId: actor?.id,
      action: 'CATEGORY_CREATED',
      entityType: 'CATEGORY',
      entityId: category.id,
      metadata: { name: category.name }
    });

    return category;
  }

  async updateCategory(id, data, actor) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      const err = new Error('Category not found.');
      err.statusCode = 404;
      throw err;
    }

    const updateData = {};
    if (data.name !== undefined) {
      const trimmed = data.name.trim();
      if (trimmed.length < 2) {
        const err = new Error('Category name must be at least 2 characters.');
        err.statusCode = 422;
        throw err;
      }
      updateData.name = trimmed;
      if (!data.slug) updateData.slug = slugify(trimmed);
    }

    if (data.slug) updateData.slug = slugify(data.slug);
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.isActive !== undefined) updateData.isActive = Boolean(data.isActive);

    const updated = await this.repo.updateCategory(id, updateData);

    await this.auditSvc.log({
      actorId: actor?.id,
      action: 'CATEGORY_UPDATED',
      entityType: 'CATEGORY',
      entityId: id,
      metadata: updateData
    });

    return updated;
  }

  async deleteCategory(id, actor) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      const err = new Error('Category not found.');
      err.statusCode = 404;
      throw err;
    }

    const notesCount = await prisma.note.count({ where: { categoryId: id } });
    if (notesCount > 0) {
      const err = new Error(
        `Cannot delete category "${category.name}" because it is referenced by ${notesCount} study notes. Please deactivate it instead.`
      );
      err.statusCode = 400;
      err.code = 'REFERENTIAL_INTEGRITY_VIOLATION';
      throw err;
    }

    await this.repo.deleteCategory(id);

    await this.auditSvc.log({
      actorId: actor?.id,
      action: 'CATEGORY_DELETED',
      entityType: 'CATEGORY',
      entityId: id,
      metadata: { name: category.name }
    });

    return { success: true, message: `Category "${category.name}" deleted successfully.` };
  }

  /**
   * --- UNIFIED ACADEMIC HIERARCHY OVERVIEW ---
   */
  async getUnifiedAcademicOverview() {
    await this.ensureDefaultUniversity();

    const [universities, schools, courses, subjects, categories] = await Promise.all([
      prisma.university.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { schools: true, courses: true, notes: true, users: true } }
        }
      }),
      prisma.school.findMany({
        orderBy: { name: 'asc' },
        include: {
          university: { select: { id: true, name: true, shortName: true } },
          _count: { select: { courses: true, notes: true } }
        }
      }),
      prisma.course.findMany({
        orderBy: { name: 'asc' },
        include: {
          university: { select: { id: true, name: true, shortName: true } },
          school: { select: { id: true, name: true } },
          _count: { select: { subjects: true, notes: true, users: true } }
        }
      }),
      prisma.subject.findMany({
        orderBy: [{ course: { name: 'asc' } }, { semester: 'asc' }, { name: 'asc' }],
        include: {
          course: { select: { id: true, name: true, semestersCount: true } },
          _count: { select: { notes: true } }
        }
      }),
      prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: {
          _count: { select: { notes: true } }
        }
      })
    ]);

    // Ensure KRMU is always prioritized at index 0
    const sortedUniversities = [...universities].sort((a, b) => {
      if (a.code === 'KRMU' || a.slug === 'krmu') return -1;
      if (b.code === 'KRMU' || b.slug === 'krmu') return 1;
      return a.name.localeCompare(b.name);
    });

    return {
      universities: sortedUniversities.map((u) => ({
        id: u.id,
        name: u.name,
        slug: u.slug,
        shortName: u.shortName,
        code: u.code,
        description: u.description,
        website: u.website,
        isActive: u.isActive,
        schoolsCount: u._count.schools,
        coursesCount: u._count.courses,
        notesCount: u._count.notes,
        usersCount: u._count.users,
        createdAt: u.createdAt
      })),
      schools: schools.map((s) => ({
        id: s.id,
        universityId: s.universityId,
        universityName: s.university?.name,
        name: s.name,
        slug: s.slug,
        code: s.code,
        description: s.description,
        isActive: s.isActive,
        coursesCount: s._count.courses,
        notesCount: s._count.notes,
        createdAt: s.createdAt
      })),
      courses: courses.map((c) => ({
        id: c.id,
        universityId: c.universityId,
        universityName: c.university?.name,
        schoolId: c.schoolId,
        schoolName: c.school?.name,
        name: c.name,
        slug: c.slug,
        code: c.code,
        degreeLevel: c.degreeLevel,
        semestersCount: c.semestersCount,
        description: c.description,
        isActive: c.isActive,
        subjectCount: c._count.subjects,
        noteCount: c._count.notes,
        userCount: c._count.users,
        createdAt: c.createdAt
      })),
      subjects: subjects.map((s) => ({
        id: s.id,
        courseId: s.courseId,
        courseName: s.course.name,
        semestersCount: s.course.semestersCount,
        name: s.name,
        slug: s.slug,
        code: s.code,
        semester: s.semester,
        credits: s.credits,
        description: s.description,
        isActive: s.isActive,
        noteCount: s._count.notes,
        createdAt: s.createdAt
      })),
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        isActive: cat.isActive,
        noteCount: cat._count.notes,
        createdAt: cat.createdAt
      }))
    };
  }
}

export const academicService = new AcademicService();
export default academicService;
