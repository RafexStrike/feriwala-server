import { HydratedDocument, Schema, Types, model } from 'mongoose';

export interface IPushSubscriptionKeys {
  auth: string;
  p256dh: string;
}

export interface IPushSubscription {
  user: Types.ObjectId;
  endpoint: string;
  keys: IPushSubscriptionKeys;
  expirationTime?: number | null;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    endpoint: { type: String, required: true, unique: true, trim: true },
    keys: {
      auth: { type: String, required: true },
      p256dh: { type: String, required: true }
    },
    expirationTime: { type: Number, default: null }
  },
  { timestamps: true }
);

export const PushSubscriptionModel = model<IPushSubscription>('PushSubscription', PushSubscriptionSchema);
export type PushSubscriptionDocument = HydratedDocument<IPushSubscription>;
