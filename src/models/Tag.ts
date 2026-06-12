import { HydratedDocument, model, Schema } from 'mongoose';

export interface ITag {
  name: string;
  slug: string;
  isActive: boolean;
}

const TagSchema = new Schema<ITag>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, trim: true, unique: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const TagModel = model<ITag>('Tag', TagSchema);
export type TagDocument = HydratedDocument<ITag>;
