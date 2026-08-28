import { HydratedDocument, Schema, Types, model } from 'mongoose';

export type OrderStatus = 'pending' | 'completed' | 'canceled';
export type OrderSource = 'website' | 'facebook' | 'phone' | 'physical_store' | 'in_person' | 'whatsapp' | 'telegram' | 'other';

export interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  costPrice: number;
}

export interface IOrderStatusHistory {
  status: OrderStatus;
  note?: string;
  changedBy?: Types.ObjectId | null;
  changedAt: Date;
}

export interface IOrder {
  user: Types.ObjectId | null;
  source: OrderSource;
  items: IOrderItem[];
  status: OrderStatus;
  subtotal: number;
  total: number;
  profit: number;
  shippingAddress: string;
  customerEmail: string;
  whatsappNumber: string;
  facebookProfileLink?: string;
  externalCustomerName?: string;
  externalCustomerPhone?: string;
  externalCustomerFacebookProfileLink?: string;
  statusHistory: IOrderStatusHistory[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const OrderStatusHistorySchema = new Schema<IOrderStatusHistory>(
  {
    status: { type: String, enum: ['pending', 'completed', 'canceled'], required: true },
    note: { type: String, default: '' },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    changedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    source: {
      type: String,
      enum: ['website', 'facebook', 'phone', 'physical_store', 'in_person', 'whatsapp', 'telegram', 'other'],
      default: 'website'
    },
    items: { type: [OrderItemSchema], default: [] },
    status: { type: String, enum: ['pending', 'completed', 'canceled'], default: 'pending' },
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    profit: { type: Number, required: true },
    shippingAddress: { type: String, default: '' },
    customerEmail: { type: String, default: '' },
    whatsappNumber: { type: String, default: '' },
    facebookProfileLink: { type: String, default: '' },
    externalCustomerName: { type: String, default: '' },
    externalCustomerPhone: { type: String, default: '' },
    externalCustomerFacebookProfileLink: { type: String, default: '' },
    statusHistory: { type: [OrderStatusHistorySchema], default: [] },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

export const OrderModel = model<IOrder>('Order', OrderSchema);
export type OrderDocument = HydratedDocument<IOrder>;
