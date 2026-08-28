import { NotificationRecipientModel } from '../models/NotificationRecipient';
import { sendEmail } from './emailService';
import { OrderDocument } from '../models/Order';
import { UserDocument } from '../models/User';
import { logger } from '../config/logger';

export const notifyOrderStatusChange = async (order: OrderDocument, changedBy: UserDocument | undefined, note?: string): Promise<void> => {
  const recipients = await NotificationRecipientModel.find({ 
    isActive: true,
    notificationTypes: { $in: ['order_status', 'order-status'] }
  });
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

export const notifyNewOrder = async (order: OrderDocument): Promise<void> => {
  const recipients = await NotificationRecipientModel.find({ 
    isActive: true,
    notificationTypes: { $in: ['new_order', 'new-order'] }
  });
  if (!recipients.length) {
    return;
  }

  const subject = `New Order Received: #${order._id}`;
  
  const itemsText = order.items.map(item => `- ${item.quantity}x ${item.name} (৳${item.price})`).join('\n');
  
  const text = [
    `New Order Received!`,
    ``,
    `Order ID: ${order._id}`,
    `Date: ${order.createdAt}`,
    `Source: ${order.source}`,
    `Status: ${order.status}`,
    ``,
    `Customer Info:`,
    `Email: ${order.customerEmail || 'N/A'}`,
    `WhatsApp: ${order.whatsappNumber || 'N/A'}`,
    `Name: ${order.externalCustomerName || 'N/A'}`,
    `Phone: ${order.externalCustomerPhone || 'N/A'}`,
    ``,
    `Shipping Address:`,
    `${order.shippingAddress || 'N/A'}`,
    ``,
    `Order Summary:`,
    `Subtotal: ৳${order.subtotal}`,
    `Total: ৳${order.total}`,
    ``,
    `Items:`,
    itemsText,
    ``,
    order.notes ? `Notes: ${order.notes}` : null
  ].filter(line => line !== null).join('\n');

  try {
    await sendEmail(recipients.map((recipient) => recipient.email), subject, text, `<pre style="font-family: sans-serif; white-space: pre-wrap;">${text}</pre>`);
  } catch (error) {
    logger.error({ error }, 'Failed to send new order notification');
  }
};
