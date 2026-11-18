import categoryRepository, { CategoryRepository } from './category.repository.js';

let categoriesCache = null;
let categoriesCacheExpiry = 0;
const CACHE_TTL_MS = 60000; // 60 seconds

export function invalidateCategoriesCache() {
  categoriesCache = null;
  categoriesCacheExpiry = 0;
}

export class CategoryService {
  constructor(repo = categoryRepository) {
    this.repo = repo;
  }

  async listCategories() {
    if (categoriesCache && Date.now() < categoriesCacheExpiry) {
      return categoriesCache;
    }
    const categories = await this.repo.findAll({ isActive: true });
    categoriesCache = categories;
    categoriesCacheExpiry = Date.now() + CACHE_TTL_MS;
    return categories;
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
