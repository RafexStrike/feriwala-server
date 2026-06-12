import { HydratedDocument, Schema, Types, model } from 'mongoose';

export interface IReview {
  user: Types.ObjectId;
  product: Types.ObjectId;
  comment: string;
  rating: number;
}

const ReviewSchema = new Schema<IReview>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    comment: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 }
  },
  { timestamps: true }
);

ReviewSchema.index({ user: 1, product: 1 }, { unique: true });

export const ReviewModel = model<IReview>('Review', ReviewSchema);
export type ReviewDocument = HydratedDocument<IReview>;
