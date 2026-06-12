import { HydratedDocument, Schema, Types, model } from 'mongoose';

export interface ICartItem {
  product: Types.ObjectId;
  quantity: number;
  priceSnapshot: number;
}

export interface ICart {
  user: Types.ObjectId;
  items: ICartItem[];
}

const CartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceSnapshot: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const CartSchema = new Schema<ICart>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: { type: [CartItemSchema], default: [] }
  },
  { timestamps: true }
);

export const CartModel = model<ICart>('Cart', CartSchema);
export type CartDocument = HydratedDocument<ICart>;
