import { Router } from 'express';
import { createCategory, deleteCategory, listCategories, updateCategory } from '../controllers/categoryController';
import { requireAdmin } from '../middleware/auth';
import { validateBody } from '../utils/validate';
import { categorySchema } from '../validations/catalogValidation';

const router = Router();

router.get('/', listCategories);
router.post('/', requireAdmin, validateBody(categorySchema), createCategory);
router.patch('/:categoryId', requireAdmin, validateBody(categorySchema.partial()), updateCategory);
router.delete('/:categoryId', requireAdmin, deleteCategory);

export default router;

