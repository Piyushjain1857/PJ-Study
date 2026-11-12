import { Router } from 'express';
import categoryController from './category.controller.js';

const router = Router();

router.get('/', categoryController.listCategories);
router.get('/:id', categoryController.getCategoryById);

export default router;

