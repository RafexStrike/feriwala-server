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
import { createManualOrder } from '../controllers/orderController';
import { getPushConfig, registerPushSubscription, unregisterPushSubscription } from '../controllers/pushController';
import { requireAdmin } from '../middleware/auth';
import { validateBody } from '../utils/validate';
import { notificationEmailSchema } from '../validations/adminValidation';
import { manualOrderSchema } from '../validations/cartOrderValidation';
import { pushSubscriptionDeleteSchema, pushSubscriptionSchema } from '../validations/pushValidation';

const router = Router();

router.use(requireAdmin);
router.get('/dashboard', getDashboardOverview);
router.get('/analytics', getAnalytics);
router.get('/inventory', getInventorySummary);
router.post('/orders', validateBody(manualOrderSchema), createManualOrder);
router.get('/push-config', getPushConfig);
router.post('/push-subscriptions', validateBody(pushSubscriptionSchema), registerPushSubscription);
router.delete('/push-subscriptions', validateBody(pushSubscriptionDeleteSchema), unregisterPushSubscription);
router.get('/notification-emails', listNotificationEmails);
router.post('/notification-emails', validateBody(notificationEmailSchema), createNotificationEmail);
router.patch('/notification-emails/:recipientId', validateBody(notificationEmailSchema.partial()), updateNotificationEmail);
router.delete('/notification-emails/:recipientId', deleteNotificationEmail);

export default router;
