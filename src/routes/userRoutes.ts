import { Router } from 'express';
import { deleteUser, getMe, getUser, listUsers, updateUser } from '../controllers/userController';
import { requireAdmin, requireVerifiedUser } from '../middleware/auth';
import { validateBody } from '../utils/validate';
import { userUpdateSchema } from '../validations/adminValidation';

const router = Router();

router.get('/me', requireVerifiedUser, getMe);
router.get('/', requireAdmin, listUsers);
router.get('/:userId', requireAdmin, getUser);
router.patch('/:userId', requireAdmin, validateBody(userUpdateSchema), updateUser);
router.delete('/:userId', requireAdmin, deleteUser);

export default router;

