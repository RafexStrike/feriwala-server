import { HydratedDocument, model, Schema } from 'mongoose';

export interface ICategory {
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const CategoryModel = model<ICategory>('Category', CategorySchema);
export type CategoryDocument = HydratedDocument<ICategory>;
