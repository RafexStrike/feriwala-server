import webpush from 'web-push';
import { ENV } from '../config/environment';
import { logger } from '../config/logger';
import { OrderDocument } from '../models/Order';
import { PushSubscriptionModel, type PushSubscriptionDocument } from '../models/PushSubscription';
import { UserModel } from '../models/User';

const pushEnabled = Boolean(ENV.WEB_PUSH_PUBLIC_KEY && ENV.WEB_PUSH_PRIVATE_KEY);

if (pushEnabled) {
  webpush.setVapidDetails(
    ENV.WEB_PUSH_SUBJECT || `mailto:${ENV.EMAIL_FROM}`,
    ENV.WEB_PUSH_PUBLIC_KEY,
    ENV.WEB_PUSH_PRIVATE_KEY
  );
}

const getOrderNotificationPayload = (order: OrderDocument) => ({
  title: 'New Order Received',
  body: `Order #${String(order._id).slice(-6)} has been placed. Total: ৳${order.total}`,
  url: `/admin/orders/${order._id}`,
  orderId: String(order._id),
  total: order.total,
  createdAt: order.createdAt
});

const deleteInvalidSubscription = async (subscription: PushSubscriptionDocument) => {
  await PushSubscriptionModel.deleteOne({ _id: subscription._id });
};

const sendToSubscription = async (subscription: PushSubscriptionDocument, payload: unknown) => {
  const encodedPayload = JSON.stringify(payload);

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      encodedPayload
    );
  } catch (error: any) {
    const statusCode = error?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      await deleteInvalidSubscription(subscription);
      return;
    }

    logger.error(
      { error, subscriptionId: String(subscription._id), endpoint: subscription.endpoint },
      'Failed to send push notification'
    );
  }
};

export const getPushPublicKey = (): string | null => {
  if (!pushEnabled) {
    return null;
  }

  return ENV.WEB_PUSH_PUBLIC_KEY || null;
};

export const upsertPushSubscription = async (input: {
  userId: string;
  endpoint: string;
  keys: { auth: string; p256dh: string };
  expirationTime?: number | null;
}) => {
  const user = await UserModel.findById(input.userId).select('role');
  if (!user || user.role !== 'admin') {
    return null;
  }

  return PushSubscriptionModel.findOneAndUpdate(
    { endpoint: input.endpoint },
    {
      user: user._id,
      endpoint: input.endpoint,
      keys: input.keys,
      expirationTime: input.expirationTime ?? null
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );
};

export const removePushSubscription = async (input: { userId: string; endpoint: string }) => {
  return PushSubscriptionModel.deleteOne({
    user: input.userId,
    endpoint: input.endpoint
  });
};

export const notifyAdminsOfNewOrderPush = async (order: OrderDocument): Promise<void> => {
  if (!pushEnabled) {
    return;
  }

  const subscriptions = await PushSubscriptionModel.find()
    .populate({ path: 'user', select: 'role email name' })
    .sort({ createdAt: -1 });

  const adminSubscriptions = subscriptions.filter((subscription) => {
    const user = subscription.user as unknown as { role?: string } | null;
    return user?.role === 'admin';
  });

  if (!adminSubscriptions.length) {
    return;
  }

  const payload = getOrderNotificationPayload(order);
  await Promise.allSettled(adminSubscriptions.map((subscription) => sendToSubscription(subscription, payload)));
};
