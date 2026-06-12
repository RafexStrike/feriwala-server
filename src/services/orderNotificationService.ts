import { NotificationRecipientModel } from '../models/NotificationRecipient';
import { sendEmail } from './emailService';
import { OrderDocument } from '../models/Order';
import { UserDocument } from '../models/User';
import { logger } from '../config/logger';

export const notifyOrderStatusChange = async (order: OrderDocument, changedBy: UserDocument | undefined, note?: string): Promise<void> => {
  const recipients = await NotificationRecipientModel.find({ isActive: true });
  if (!recipients.length) {
    return;
  }

  const subject = `Order ${order._id} status updated to ${order.status}`;
  const text = [
    `Order ID: ${order._id}`,
    `Status: ${order.status}`,
    `Customer: ${order.customerEmail}`,
    `Changed by: ${changedBy?.email ?? 'system'}`,
    note ? `Note: ${note}` : null
  ]
    .filter(Boolean)
    .join('\n');

  try {
    await sendEmail(recipients.map((recipient) => recipient.email), subject, text, `<pre>${text}</pre>`);
  } catch (error) {
    logger.error({ error }, 'Failed to send order status notification');
  }
};

