import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateInventory,
  updateProduct
} from '../controllers/productController';
import { createReview, deleteReview, listReviews } from '../controllers/reviewController';
import { requireAdmin, requireVerifiedUser } from '../middleware/auth';
import { validateBody } from '../utils/validate';
import { inventoryUpdateSchema, productSchema, productUpdateSchema } from '../validations/catalogValidation';
import { reviewSchema } from '../validations/reviewValidation';

const router = Router();

router.get('/', listProducts);
router.post('/', requireAdmin, validateBody(productSchema), createProduct);
router.get('/:productId/reviews', listReviews);
router.post('/:productId/reviews', requireVerifiedUser, validateBody(reviewSchema), createReview);
router.delete('/:productId/reviews', requireVerifiedUser, deleteReview);
router.get('/:productId', getProduct);
router.patch('/:productId', requireAdmin, validateBody(productUpdateSchema), updateProduct);
router.patch('/:productId/inventory', requireAdmin, validateBody(inventoryUpdateSchema), updateInventory);
router.delete('/:productId', requireAdmin, deleteProduct);

export default router;

