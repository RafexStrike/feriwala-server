import mongoose, { Types } from 'mongoose';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { CartModel } from '../models/Cart';
import { OrderModel, OrderStatus } from '../models/Order';
import { createOrderRecord } from '../services/orderCreationService';
import { notifyOrderStatusChange } from '../services/orderNotificationService';

export const createOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { shippingAddress, customerEmail, notes, whatsappNumber, facebookProfileLink } = req.body as {
    shippingAddress: string;
    customerEmail?: string;
    notes?: string;
    whatsappNumber: string;
    facebookProfileLink?: string;
  };

  const cart = await CartModel.findOne({ user: req.user!.id });
  if (!cart || !cart.items.length) {
    throw new ApiError(400, 'Cart is empty');
  }

  const order = await createOrderRecord({
    userId: req.user!.id,
    source: 'website',
    items: cart.items.map((item) => ({
      productId: String(item.product),
      quantity: item.quantity,
      price: item.priceSnapshot
    })),
    shippingAddress,
    customerEmail: customerEmail ?? req.user!.email,
    whatsappNumber,
    facebookProfileLink,
    notes: notes ?? '',
    cart
  });

  res.status(201).json({ success: true, data: order });
});

export const createManualOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const {
    source,
    status,
    shippingAddress,
    customerEmail,
    whatsappNumber,
    facebookProfileLink,
    externalCustomerName,
    externalCustomerPhone,
    externalCustomerFacebookProfileLink,
    notes,
    items
  } = req.body as {
    source?: string;
    status?: OrderStatus;
    shippingAddress?: string;
    customerEmail?: string;
    whatsappNumber?: string;
    facebookProfileLink?: string;
    externalCustomerName?: string;
    externalCustomerPhone?: string;
    externalCustomerFacebookProfileLink?: string;
    notes?: string;
    items: Array<{ productId: string; quantity: number }>;
  };

  const order = await createOrderRecord({
    source: source as any,
    status,
    items: items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity
    })),
    shippingAddress,
    customerEmail,
    whatsappNumber,
    facebookProfileLink,
    externalCustomerName,
    externalCustomerPhone,
    externalCustomerFacebookProfileLink,
    notes,
    statusNote: 'Manual order created'
  });

  res.status(201).json({ success: true, data: order });
});

export const listOrders = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const filter = req.user!.role === 'admin' ? {} : { user: req.user!.id };
  const orders = await OrderModel.find(filter).sort({ createdAt: -1 }).populate('user', 'name email');
  res.json({ success: true, data: orders });
});

export const getOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const order = await OrderModel.findById(req.params.orderId).populate('user', 'name email');
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (req.user!.role !== 'admin') {
    const isOwner = await OrderModel.exists({ _id: order._id, user: req.user!.id });
    if (!isOwner) {
      throw new ApiError(403, 'Access denied');
    }
  }

  res.json({ success: true, data: order });
});

export const updateOrderStatus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const order = await OrderModel.findById(req.params.orderId).populate('user', 'name email');
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  const { status, note } = req.body as { status: OrderStatus; note?: string };
  order.status = status;
  order.statusHistory.push({
    status,
    note,
    changedBy: new Types.ObjectId(req.user!.id),
    changedAt: new Date()
  });

  await order.save();
  await notifyOrderStatusChange(order, req.user!, note);

  res.json({ success: true, data: order });
});
