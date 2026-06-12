import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { NotificationRecipientModel } from '../models/NotificationRecipient';
import { buildAnalyticsSummary } from '../services/analyticsService';
import { ProductModel } from '../models/Product';
import { OrderModel } from '../models/Order';
import { UserModel } from '../models/User';
import { ApiError } from '../utils/ApiError';

export const getAnalytics = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const summary = await buildAnalyticsSummary();
  res.json({ success: true, data: summary });
});

export const getInventorySummary = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const lowStockProducts = await ProductModel.find({ stock: { $lte: 10 } })
    .select('name stock price averageRating reviewCount')
    .sort({ stock: 1 });

  const totals = await ProductModel.aggregate([
    {
      $group: {
        _id: null,
        totalProducts: { $sum: 1 },
        totalInventoryUnits: { $sum: '$stock' }
      }
    }
  ]);

  res.json({
    success: true,
    data: {
      lowStockProducts,
      totals: totals[0] ?? { totalProducts: 0, totalInventoryUnits: 0 }
    }
  });
});

export const getDashboardOverview = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const [users, products, orders, analytics] = await Promise.all([
    UserModel.countDocuments(),
    ProductModel.countDocuments(),
    OrderModel.countDocuments(),
    buildAnalyticsSummary()
  ]);

  res.json({
    success: true,
    data: {
      users,
      products,
      orders,
      analytics
    }
  });
});

export const listNotificationEmails = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const recipients = await NotificationRecipientModel.find().sort({ createdAt: -1 });
  res.json({ success: true, data: recipients });
});

export const createNotificationEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, isActive, notificationTypes } = req.body as {
    email: string;
    isActive?: boolean;
    notificationTypes?: string[];
  };

  const recipient = await NotificationRecipientModel.create({
    email,
    isActive: isActive ?? true,
    notificationTypes: notificationTypes ?? ['order-status'],
    createdBy: req.user!._id
  });

  res.status(201).json({ success: true, data: recipient });
});

export const updateNotificationEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const recipient = await NotificationRecipientModel.findById(req.params.recipientId);
  if (!recipient) {
    throw new ApiError(404, 'Notification recipient not found');
  }

  const { email, isActive, notificationTypes } = req.body as {
    email?: string;
    isActive?: boolean;
    notificationTypes?: string[];
  };

  if (email !== undefined) recipient.email = email;
  if (typeof isActive === 'boolean') recipient.isActive = isActive;
  if (notificationTypes !== undefined) recipient.notificationTypes = notificationTypes;

  await recipient.save();
  res.json({ success: true, data: recipient });
});

export const deleteNotificationEmail = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const recipient = await NotificationRecipientModel.findById(req.params.recipientId);
  if (!recipient) {
    throw new ApiError(404, 'Notification recipient not found');
  }

  await recipient.deleteOne();
  res.json({ success: true, message: 'Notification recipient deleted successfully' });
});
