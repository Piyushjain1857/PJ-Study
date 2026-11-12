import categoryService, { CategoryService } from './category.service.js';
import { sendSuccess } from '../../utils/apiResponse.js';

export class CategoryController {
  constructor(service = categoryService) {
    this.service = service;
  }

  listCategories = async (req, res, next) => {
    try {
      const categories = await this.service.listCategories();
      return sendSuccess(res, categories);
    } catch (err) {
      return next(err);
    }
  };

  getCategoryById = async (req, res, next) => {
    try {
      const category = await this.service.getCategoryById(req.params.id);
      return sendSuccess(res, category);
    } catch (err) {
      return next(err);
    }
  };
}

export const categoryController = new CategoryController();
export default categoryController;

