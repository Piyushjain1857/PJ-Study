import prisma from '../../config/database.js';

export class AcademicRepository {
  /**
   * Universities
   */
  async getUniversities(params = {}) {
    const { search, isActive = true } = params;
    const where = {};

    if (isActive !== undefined && isActive !== null) {
      where.isActive = Boolean(isActive);
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term } },
        { shortName: { contains: term } },
        { code: { contains: term } }
      ];
    }

    return prisma.university.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { schools: true, courses: true, notes: true, users: true }
        }
      }
    });
  }

  async findUniversityById(id) {
    return prisma.university.findUnique({
      where: { id },
      include: {
        schools: { where: { isActive: true }, orderBy: { name: 'asc' } },
        courses: { where: { isActive: true }, orderBy: { name: 'asc' } },
        _count: {
          select: { schools: true, courses: true, notes: true, users: true }
        }
      }
    });
  }

  async findUniversityBySlug(slug) {
    return prisma.university.findUnique({ where: { slug } });
  }

  async findUniversityByName(name) {
    return prisma.university.findFirst({
      where: { name: { equals: name.trim() } }
    });
  }

  async createUniversity(data) {
    return prisma.university.create({ data });
  }

  async updateUniversity(id, data) {
    return prisma.university.update({ where: { id }, data });
  }

  async deleteUniversity(id) {
    return prisma.university.delete({ where: { id } });
  }

  /**
   * Schools / Faculties
   */
  async getSchools(params = {}) {
    const { universityId, search, isActive = true } = params;
    const where = {};

    if (universityId) {
      where.universityId = universityId;
    }

    if (isActive !== undefined && isActive !== null) {
      where.isActive = Boolean(isActive);
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [{ name: { contains: term } }, { code: { contains: term } }];
    }

    return prisma.school.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        university: { select: { id: true, name: true, shortName: true } },
        _count: { select: { courses: true, notes: true } }
      }
    });
  }

  async findSchoolById(id) {
    return prisma.school.findUnique({
      where: { id },
      include: {
        university: { select: { id: true, name: true, shortName: true } },
        courses: { where: { isActive: true }, orderBy: { name: 'asc' } },
        _count: { select: { courses: true, notes: true } }
      }
    });
  }

  async createSchool(data) {
    return prisma.school.create({ data });
  }

  async updateSchool(id, data) {
    return prisma.school.update({ where: { id }, data });
  }

  async deleteSchool(id) {
    return prisma.school.delete({ where: { id } });
  }

  /**
   * Courses
   */
  async getCourses(params = {}) {
    const { universityId, schoolId, degreeLevel, search, isActive = true } = params;
    const where = {};

    if (universityId) where.universityId = universityId;
    if (schoolId) where.schoolId = schoolId;
    if (degreeLevel) where.degreeLevel = degreeLevel;

    if (isActive !== undefined && isActive !== null) {
      where.isActive = Boolean(isActive);
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term } },
        { code: { contains: term } },
        { slug: { contains: term } }
      ];
    }

    return prisma.course.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        university: { select: { id: true, name: true, shortName: true } },
        school: { select: { id: true, name: true } },
        _count: { select: { subjects: true, notes: true, users: true } }
      }
    });
  }

  async findCourseById(id) {
    return prisma.course.findUnique({
      where: { id },
      include: {
        university: { select: { id: true, name: true, shortName: true } },
        school: { select: { id: true, name: true } },
        subjects: {
          orderBy: [{ semester: 'asc' }, { name: 'asc' }],
          include: { _count: { select: { notes: true } } }
        },
        _count: { select: { subjects: true, notes: true, users: true } }
      }
    });
  }

  async createCourse(data) {
    return prisma.course.create({ data });
  }

  async updateCourse(id, data) {
    return prisma.course.update({ where: { id }, data });
  }

  async deleteCourse(id) {
    return prisma.course.delete({ where: { id } });
  }

  /**
   * Subjects
   */
  async getSubjects(params = {}) {
    const { courseId, semester, search, isActive = true } = params;
    const where = {};

    if (courseId) where.courseId = courseId;
    if (semester !== undefined && semester !== null && semester !== '') {
      where.semester = Number(semester);
    }

    if (isActive !== undefined && isActive !== null) {
      where.isActive = Boolean(isActive);
    }

    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { name: { contains: term } },
        { code: { contains: term } },
        { slug: { contains: term } }
      ];
    }

    return prisma.subject.findMany({
      where,
      orderBy: [{ course: { name: 'asc' } }, { semester: 'asc' }, { name: 'asc' }],
      include: {
        course: { select: { id: true, name: true, semestersCount: true } },
        _count: { select: { notes: true } }
      }
    });
  }

  async findSubjectById(id) {
    return prisma.subject.findUnique({
      where: { id },
      include: {
        course: { select: { id: true, name: true, semestersCount: true } },
        _count: { select: { notes: true } }
      }
    });
  }

  async createSubject(data) {
    return prisma.subject.create({ data });
  }

  async updateSubject(id, data) {
    return prisma.subject.update({ where: { id }, data });
  }

  async deleteSubject(id) {
    return prisma.subject.delete({ where: { id } });
  }

  /**
   * Categories
   */
  async getCategories(params = {}) {
    const { search, isActive = true } = params;
    const where = {};

    if (isActive !== undefined && isActive !== null) {
      where.isActive = Boolean(isActive);
    }

    if (search && search.trim()) {
      where.name = { contains: search.trim() };
    }

    return prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { notes: true } }
      }
    });
  }

  async findCategoryById(id) {
    return prisma.category.findUnique({
      where: { id },
      include: {
        _count: { select: { notes: true } }
      }
    });
  }

  async createCategory(data) {
    return prisma.category.create({ data });
  }

  async updateCategory(id, data) {
    return prisma.category.update({ where: { id }, data });
  }

  async deleteCategory(id) {
    return prisma.category.delete({ where: { id } });
  }
}

export const academicRepository = new AcademicRepository();
export default academicRepository;
