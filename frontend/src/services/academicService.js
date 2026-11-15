import apiClient from './api.js';

/**
 * Academic Content Management & Taxonomy API Client for PJ Study.
 */
export const academicService = {
  /**
   * Retrieves unified academic overview with record counts across all levels.
   */
  async getOverview() {
    const res = await apiClient.get('/academics/overview');
    return res.data?.data;
  },

  // --- UNIVERSITIES ---
  async getUniversities(params = {}) {
    const res = await apiClient.get('/academics/universities', { params });
    return res.data?.data;
  },

  async getUniversity(id) {
    const res = await apiClient.get(`/academics/universities/${id}`);
    return res.data?.data;
  },

  async createUniversity(data) {
    const res = await apiClient.post('/academics/universities', data);
    return res.data?.data;
  },

  async updateUniversity(id, data) {
    const res = await apiClient.patch(`/academics/universities/${id}`, data);
    return res.data?.data;
  },

  async deleteUniversity(id) {
    const res = await apiClient.delete(`/academics/universities/${id}`);
    return res.data?.data;
  },

  // --- SCHOOLS / FACULTIES ---
  async getSchools(params = {}) {
    const res = await apiClient.get('/academics/schools', { params });
    return res.data?.data;
  },

  async getSchool(id) {
    const res = await apiClient.get(`/academics/schools/${id}`);
    return res.data?.data;
  },

  async createSchool(data) {
    const res = await apiClient.post('/academics/schools', data);
    return res.data?.data;
  },

  async updateSchool(id, data) {
    const res = await apiClient.patch(`/academics/schools/${id}`, data);
    return res.data?.data;
  },

  async deleteSchool(id) {
    const res = await apiClient.delete(`/academics/schools/${id}`);
    return res.data?.data;
  },

  // --- COURSES & DYNAMIC SEMESTERS ---
  async getCourses(params = {}) {
    const res = await apiClient.get('/academics/courses', { params });
    return res.data?.data;
  },

  async getCourse(id) {
    const res = await apiClient.get(`/academics/courses/${id}`);
    return res.data?.data;
  },

  async getCourseSemesters(id) {
    const res = await apiClient.get(`/academics/courses/${id}/semesters`);
    return res.data?.data;
  },

  async createCourse(data) {
    const res = await apiClient.post('/academics/courses', data);
    return res.data?.data;
  },

  async updateCourse(id, data) {
    const res = await apiClient.patch(`/academics/courses/${id}`, data);
    return res.data?.data;
  },

  async deleteCourse(id) {
    const res = await apiClient.delete(`/academics/courses/${id}`);
    return res.data?.data;
  },

  // --- SUBJECTS ---
  async getSubjects(params = {}) {
    const res = await apiClient.get('/academics/subjects', { params });
    return res.data?.data;
  },

  async getSubject(id) {
    const res = await apiClient.get(`/academics/subjects/${id}`);
    return res.data?.data;
  },

  async createSubject(data) {
    const res = await apiClient.post('/academics/subjects', data);
    return res.data?.data;
  },

  async updateSubject(id, data) {
    const res = await apiClient.patch(`/academics/subjects/${id}`, data);
    return res.data?.data;
  },

  async deleteSubject(id) {
    const res = await apiClient.delete(`/academics/subjects/${id}`);
    return res.data?.data;
  },

  // --- CATEGORIES ---
  async getCategories(params = {}) {
    const res = await apiClient.get('/academics/categories', { params });
    return res.data?.data;
  },

  async getCategory(id) {
    const res = await apiClient.get(`/academics/categories/${id}`);
    return res.data?.data;
  },

  async createCategory(data) {
    const res = await apiClient.post('/academics/categories', data);
    return res.data?.data;
  },

  async updateCategory(id, data) {
    const res = await apiClient.patch(`/academics/categories/${id}`, data);
    return res.data?.data;
  },

  async deleteCategory(id) {
    const res = await apiClient.delete(`/academics/categories/${id}`);
    return res.data?.data;
  }
};

export default academicService;
