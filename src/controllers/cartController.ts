import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { CartModel } from '../models/Cart';
import { ProductModel } from '../models/Product';
import { CartDocument } from '../models/Cart';

const getOrCreateCart = async (userId: Types.ObjectId): Promise<CartDocument> => {
  const existingCart = await CartModel.findOne({ user: userId });
  if (existingCart) {
    return existingCart;
  }
  return CartModel.create({ user: userId, items: [] });
};

export const viewCart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const cart = await getOrCreateCart(req.user!._id);
  await cart.populate('items.product');
  res.json({ success: true, data: cart });
});

export const addToCart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { productId, quantity } = req.body as { productId: string; quantity: number };
  const product = await ProductModel.findById(productId);
  if (!product || !product.isActive) {
    throw new ApiError(404, 'Product not found');
  }
  if (product.stock < quantity) {
    throw new ApiError(400, 'Not enough stock available');
  }

  const cart = await getOrCreateCart(req.user!._id);
  const existingItem = cart.items.find((item) => item.product.toString() === productId);
  if (existingItem) {
    existingItem.quantity += quantity;
    existingItem.priceSnapshot = product.price;
  } else {
    cart.items.push({
      product: product._id,
      quantity,
      priceSnapshot: product.price
    });
  }

  await cart.save();
  await cart.populate('items.product');
  res.status(201).json({ success: true, data: cart });
});

export const updateCartItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { quantity } = req.body as { quantity: number };
  const cart = await getOrCreateCart(req.user!._id);
  const item = cart.items.find((entry) => entry.product.toString() === req.params.productId);
  if (!item) {
    throw new ApiError(404, 'Cart item not found');
  }
  item.quantity = quantity;
  await cart.save();
  await cart.populate('items.product');
  res.json({ success: true, data: cart });
});

export const removeCartItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const cart = await getOrCreateCart(req.user!._id);
  cart.items = cart.items.filter((item) => item.product.toString() !== req.params.productId);
  await cart.save();
  await cart.populate('items.product');
  res.json({ success: true, data: cart });
});

export const clearCart = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const cart = await getOrCreateCart(req.user!._id);
  cart.items = [];
  await cart.save();
  res.json({ success: true, message: 'Cart cleared successfully' });
});
