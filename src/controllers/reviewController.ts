import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ReviewModel } from '../models/Review';
import { ProductModel } from '../models/Product';
import { recalculateProductRating } from '../services/productMetricsService';

export const listReviews = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const reviews = await ReviewModel.find({ product: req.params.productId })
    .sort({ createdAt: -1 })
    .populate('user', 'name');

  res.json({ success: true, data: reviews });
});

export const createReview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { rating, comment } = req.body as { rating: number; comment: string };
  const product = await ProductModel.findById(req.params.productId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const review = await ReviewModel.findOneAndUpdate(
    { product: product._id, user: req.user!.id },
    { rating, comment },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  await recalculateProductRating(product._id);
  res.status(201).json({ success: true, data: review });
});

export const deleteReview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const review = await ReviewModel.findOneAndDelete({ product: req.params.productId, user: req.user!.id });
  if (!review) {
    throw new ApiError(404, 'Review not found');
  }

  await recalculateProductRating(String(req.params.productId));
  res.json({ success: true, message: 'Review deleted successfully' });
});
