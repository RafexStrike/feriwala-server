import { HydratedDocument, Schema, Types, model } from 'mongoose';

export interface INotificationRecipient {
  email: string;
  isActive: boolean;
  notificationTypes: string[];
  createdBy?: Types.ObjectId | null;
}

const NotificationRecipientSchema = new Schema<INotificationRecipient>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    isActive: { type: Boolean, default: true },
    notificationTypes: { type: [String], default: ['order-status'] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null }
  },
  { timestamps: true }
);

export const NotificationRecipientModel = model<INotificationRecipient>('NotificationRecipient', NotificationRecipientSchema);
export type NotificationRecipientDocument = HydratedDocument<INotificationRecipient>;
