import { Router } from 'express';
import { addToCart, clearCart, removeCartItem, updateCartItem, viewCart } from '../controllers/cartController';
import { requireVerifiedUser } from '../middleware/auth';
import { validateBody } from '../utils/validate';
import { cartItemSchema, cartUpdateSchema } from '../validations/cartOrderValidation';

const router = Router();

router.use(requireVerifiedUser);
router.get('/', viewCart);
router.post('/items', validateBody(cartItemSchema), addToCart);
router.patch('/items/:productId', validateBody(cartUpdateSchema), updateCartItem);
router.delete('/items/:productId', removeCartItem);
router.delete('/', clearCart);

export default router;

