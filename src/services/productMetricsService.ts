import { Types } from 'mongoose';
import { ProductModel } from '../models/Product';
import { ReviewModel } from '../models/Review';

export const recalculateProductRating = async (productId: string | Types.ObjectId): Promise<void> => {
  const [stats] = await ReviewModel.aggregate([
    { $match: { product: new Types.ObjectId(productId) } },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  await ProductModel.findByIdAndUpdate(productId, {
    averageRating: stats?.averageRating ?? 0,
    reviewCount: stats?.reviewCount ?? 0
  });
};

