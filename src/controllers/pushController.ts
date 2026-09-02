import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { getPushPublicKey, removePushSubscription, upsertPushSubscription } from '../services/pushNotificationService';

export const getPushConfig = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const publicKey = getPushPublicKey();

  if (!publicKey) {
    throw new ApiError(503, 'Push notifications are not configured on this server');
  }

  res.json({ success: true, data: { publicKey } });
});

export const registerPushSubscription = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { endpoint, keys, expirationTime } = req.body as {
    endpoint?: string;
    keys?: { auth?: string; p256dh?: string };
    expirationTime?: number | null;
  };

  if (!endpoint || !keys?.auth || !keys?.p256dh) {
    throw new ApiError(400, 'Invalid push subscription');
  }

  const subscription = await upsertPushSubscription({
    userId: req.user!.id,
    endpoint,
    keys: {
      auth: keys.auth,
      p256dh: keys.p256dh
    },
    expirationTime: typeof expirationTime === 'number' ? expirationTime : null
  });

  if (!subscription) {
    throw new ApiError(403, 'Administrator access required');
  }

  res.status(201).json({ success: true, data: subscription });
});

export const unregisterPushSubscription = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { endpoint } = req.body as { endpoint?: string };

  if (!endpoint) {
    throw new ApiError(400, 'Push subscription endpoint is required');
  }

  await removePushSubscription({
    userId: req.user!.id,
    endpoint
  });

  res.json({ success: true, message: 'Push subscription removed successfully' });
});
