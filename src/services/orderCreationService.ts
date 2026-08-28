import mongoose, { Types } from 'mongoose';
import { ApiError } from '../utils/ApiError';
import { ProductModel } from '../models/Product';
import { OrderModel, type IOrderItem, type OrderStatus, type OrderSource } from '../models/Order';
import { notifyNewOrder } from './orderNotificationService';

export const ORDER_SOURCES: OrderSource[] = [
  'website',
  'facebook',
  'phone',
  'physical_store',
  'in_person',
  'whatsapp',
  'telegram',
  'other'
];

export interface OrderLineInput {
  productId: string;
  quantity: number;
  price?: number;
}

export interface OrderCreationInput {
  userId?: string | Types.ObjectId | null;
  source?: OrderSource;
  status?: OrderStatus;
  items: OrderLineInput[];
  shippingAddress?: string;
  customerEmail?: string;
  whatsappNumber?: string;
  facebookProfileLink?: string;
  externalCustomerName?: string;
  externalCustomerPhone?: string;
  externalCustomerFacebookProfileLink?: string;
  notes?: string;
  statusNote?: string;
  cart?: {
    items: Array<{ product: Types.ObjectId; quantity: number; priceSnapshot: number }>;
    save: (options?: { session?: mongoose.ClientSession }) => Promise<any>;
  } | null;
}

export const calculateOrderTotals = (items: Array<{ quantity: number; price: number; costPrice: number }>) => {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal;
  const profit = items.reduce((sum, item) => sum + (item.price - item.costPrice) * item.quantity, 0);
  return { subtotal, total, profit };
};

export const createOrderRecord = async (input: OrderCreationInput) => {
  const normalizedItems = [...(input.items ?? [])]
    .filter((item) => item && Number.isFinite(item.quantity) && item.quantity > 0)
    .reduce<Map<string, OrderLineInput>>((acc, item) => {
      const key = item.productId;
      const current = acc.get(key);
      if (current) {
        current.quantity += item.quantity;
        if (typeof item.price === 'number' && item.price >= 0) {
          current.price = item.price;
        }
        acc.set(key, current);
      } else {
        acc.set(key, { ...item, quantity: Number(item.quantity) });
      }
      return acc;
    }, new Map());

  if (normalizedItems.size === 0) {
    throw new ApiError(400, 'Order must include at least one item');
  }

  const orderSource = input.source ?? 'website';
  const orderStatus = input.status ?? 'pending';
  const orderStatusNote = input.statusNote ?? 'Order created';
  const productIds = Array.from(normalizedItems.keys());

  const session = await mongoose.startSession();

  try {
    let createdOrder: any;

    await session.withTransaction(async () => {
      const products = await ProductModel.find({ _id: { $in: productIds } }).session(session);
      const productMap = new Map(products.map((product) => [String(product._id), product]));

      const orderItems: IOrderItem[] = [];

      for (const [productId, item] of normalizedItems.entries()) {
        const product = productMap.get(productId);
        if (!product) {
          throw new ApiError(404, `Product not found: ${productId}`);
        }

        const quantity = Number(item.quantity);
        if (!Number.isInteger(quantity) || quantity <= 0) {
          throw new ApiError(400, `Invalid quantity for product ${product.name}`);
        }

        if (product.stock < quantity) {
          throw new ApiError(400, `Not enough stock for ${product.name}`);
        }

        const unitPrice = typeof item.price === 'number' ? item.price : product.price;
        product.stock -= quantity;
        await product.save({ session });

        orderItems.push({
          product: product._id,
          name: product.name,
          quantity,
          price: unitPrice,
          costPrice: product.costPrice
        });
      }

      const totals = calculateOrderTotals(orderItems);
      const [order] = await OrderModel.create([
        {
          user: input.userId ? new Types.ObjectId(input.userId) : null,
          source: orderSource,
          items: orderItems,
          status: orderStatus,
          subtotal: totals.subtotal,
          total: totals.total,
          profit: totals.profit,
          shippingAddress: input.shippingAddress ?? '',
          customerEmail: input.customerEmail ?? '',
          whatsappNumber: input.whatsappNumber ?? '',
          facebookProfileLink: input.facebookProfileLink ?? '',
          externalCustomerName: input.externalCustomerName ?? '',
          externalCustomerPhone: input.externalCustomerPhone ?? '',
          externalCustomerFacebookProfileLink: input.externalCustomerFacebookProfileLink ?? '',
          notes: input.notes ?? '',
          statusHistory: [{
            status: orderStatus,
            note: orderStatusNote,
            changedAt: new Date()
          }]
        }
      ], { session });

      if (input.cart) {
        input.cart.items = [];
        await input.cart.save({ session });
      }

      createdOrder = order;
    });

    notifyNewOrder(createdOrder).catch((error) => {
      // Intentionally swallow error; notification failures shouldn't block order creation
    });

    return createdOrder;
  } finally {
    await session.endSession();
  }
};
