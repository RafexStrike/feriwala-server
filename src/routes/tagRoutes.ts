import { Router } from 'express';
import { createTag, deleteTag, listTags, updateTag } from '../controllers/tagController';
import { requireAdmin } from '../middleware/auth';
import { validateBody } from '../utils/validate';
import { tagSchema } from '../validations/catalogValidation';

const router = Router();

router.get('/', listTags);
router.post('/', requireAdmin, validateBody(tagSchema), createTag);
router.patch('/:tagId', requireAdmin, validateBody(tagSchema.partial()), updateTag);
router.delete('/:tagId', requireAdmin, deleteTag);

export default router;

