import categoryRepository, { CategoryRepository } from './category.repository.js';

export class CategoryService {
  constructor(repo = categoryRepository) {
    this.repo = repo;
  }

  async listCategories() {
    return this.repo.findAll({ isActive: true });
  }

  async getCategoryById(id) {
    const category = await this.repo.findById(id);
    if (!category) {
      const error = new Error(`Category with ID "${id}" was not found.`);
      error.statusCode = 404;
      error.code = 'CATEGORY_NOT_FOUND';
      throw error;
    }
    return category;
  }
}

export const categoryService = new CategoryService();
export default categoryService;
