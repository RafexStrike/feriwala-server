import { HydratedDocument, Types, model, Schema } from 'mongoose';

export interface IProduct {
  name: string;
  briefDescription: string;
  detailedDescription: string;
  price: number;
  costPrice: number;
  stock: number;
  categories: Types.ObjectId[];
  tags: Types.ObjectId[];
  images: string[];
  isActive: boolean;
  isFeatured: boolean;
  averageRating: number;
  reviewCount: number;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    briefDescription: { type: String, required: true, trim: true },
    detailedDescription: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, default: 0, min: 0 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category', default: [] }],
    tags: [{ type: Schema.Types.ObjectId, ref: 'Tag', default: [] }],
    images: [{ type: String, default: [] }],
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const ProductModel = model<IProduct>('Product', ProductSchema);
export type ProductDocument = HydratedDocument<IProduct>;
