import mongoose, { Types } from 'mongoose';
import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { CartModel } from '../models/Cart';
import { OrderModel, OrderStatus } from '../models/Order';
import { ProductModel } from '../models/Product';
import { notifyOrderStatusChange } from '../services/orderNotificationService';

const calculateOrderTotals = (items: Array<{ quantity: number; price: number; costPrice: number }>) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal;
  const profit = items.reduce((sum, item) => sum + (item.price - item.costPrice) * item.quantity, 0);
  return { subtotal, total, profit };
};

export const createOrder = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { shippingAddress, customerEmail, notes } = req.body as {
    shippingAddress: string;
    customerEmail?: string;
    notes?: string;
  };

  try {
    const cart = await CartModel.findOne({ user: req.user!.id });
    if (!cart || !cart.items.length) {
      throw new ApiError(400, 'Cart is empty');
    }

    const orderItems = [];
    for (const item of cart.items) {
      const product = await ProductModel.findById(item.product);
      if (!product) {
        throw new ApiError(404, 'A product in the cart was not found');
      }
      if (product.stock < item.quantity) {
        throw new ApiError(400, `Not enough stock for ${product.name}`);
      }

      product.stock -= item.quantity;
      await product.save();

      orderItems.push({
        product: product._id,
        name: product.name,
        quantity: item.quantity,
        price: item.priceSnapshot,
        costPrice: product.costPrice
      });
    }

    const totals = calculateOrderTotals(orderItems);
    const order = await OrderModel.create(
      [
        {
          user: new Types.ObjectId(req.user!.id),
          items: orderItems,
          status: 'pending',
          subtotal: totals.subtotal,
          total: totals.total,
          profit: totals.profit,
          shippingAddress,
          customerEmail: customerEmail ?? req.user!.email,
          notes: notes ?? '',
          statusHistory: [
            {
              status: 'pending',
              note: 'Order created'
            }
          ]
        }
      ]
    );

    cart.items = [];
    await cart.save();

    res.status(201).json({ success: true, data: order[0] });
  } catch (error) {
    throw error;
  }
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

  const orderUserId = typeof (order.user as any)?._id !== 'undefined' ? String((order.user as any)._id) : String(order.user);
  if (req.user!.role !== 'admin' && orderUserId !== req.user!.id) {
    throw new ApiError(403, 'Access denied');
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
