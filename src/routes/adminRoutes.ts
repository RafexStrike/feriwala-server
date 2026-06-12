import { Router } from 'express';
import {
  createNotificationEmail,
  deleteNotificationEmail,
  getAnalytics,
  getDashboardOverview,
  getInventorySummary,
  listNotificationEmails,
  updateNotificationEmail
} from '../controllers/adminController';
import { requireAdmin } from '../middleware/auth';
import { validateBody } from '../utils/validate';
import { notificationEmailSchema } from '../validations/adminValidation';

const router = Router();

router.use(requireAdmin);
router.get('/dashboard', getDashboardOverview);
router.get('/analytics', getAnalytics);
router.get('/inventory', getInventorySummary);
router.get('/notification-emails', listNotificationEmails);
router.post('/notification-emails', validateBody(notificationEmailSchema), createNotificationEmail);
router.patch('/notification-emails/:recipientId', validateBody(notificationEmailSchema.partial()), updateNotificationEmail);
router.delete('/notification-emails/:recipientId', deleteNotificationEmail);

export default router;

