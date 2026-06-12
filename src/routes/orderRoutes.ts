import { Router } from 'express';
import { createOrder, getOrder, listOrders, updateOrderStatus } from '../controllers/orderController';
import { requireAdmin, requireVerifiedUser } from '../middleware/auth';
import { validateBody } from '../utils/validate';
import { checkoutSchema, statusUpdateSchema } from '../validations/cartOrderValidation';

const router = Router();

router.use(requireVerifiedUser);
router.post('/', validateBody(checkoutSchema), createOrder);
router.get('/', listOrders);
router.get('/:orderId', getOrder);
router.patch('/:orderId/status', requireAdmin, validateBody(statusUpdateSchema), updateOrderStatus);

export default router;

