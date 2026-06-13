import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { logger } from '../config/logger';
import { CategoryModel } from '../models/Category';
import { TagModel } from '../models/Tag';
import { ProductModel } from '../models/Product';
import { UserModel } from '../models/User';
import { ReviewModel } from '../models/Review';
import { CartModel } from '../models/Cart';
import { OrderModel } from '../models/Order';
import { NotificationRecipientModel } from '../models/NotificationRecipient';

const SEED_PREFIX = 'AUTOSEED_';

async function cleanup() {
  try {
    await connectDB();
    logger.info('Starting database cleanup...');

    const results: Record<string, number> = {};

    // Order of deletion to avoid dependency issues
    const collections = [
      { name: 'Order', model: OrderModel, field: 'shippingAddress' },
      { name: 'Cart', model: CartModel, field: 'user' }, // we will check if user was seeded
      { name: 'Review', model: ReviewModel, field: 'comment' }, // we'll check comment or user
      { name: 'NotificationRecipient', model: NotificationRecipientModel, field: 'email' },
      { name: 'Product', model: ProductModel, field: 'name' },
      { name: 'Category', model: CategoryModel, field: 'name' },
      { name: 'Tag', model: TagModel, field: 'name' },
      { name: 'User', model: UserModel, field: 'name' },
    ];

    // For Users, we also have a specific test email
    const seededUserEmails = ['seed.user@example.com', 'user1@example.com', 'user2@example.com', 'user3@example.com'];

    for (const col of collections) {
      let deletedCount = 0;

      if (col.name === 'User') {
        const usersToDelete = await UserModel.find({
          $or: [
            { name: { $regex: `^${SEED_PREFIX}` } },
            { email: { $in: seededUserEmails } }
          ]
        });
        deletedCount = await UserModel.deleteMany({
          $or: [
            { name: { $regex: `^${SEED_PREFIX}` } },
            { email: { $in: seededUserEmails } }
          ]
        }).then(res => res.deletedCount);
      } else if (col.name === 'Order') {
        deletedCount = await OrderModel.deleteMany({
          shippingAddress: { $regex: `^${SEED_PREFIX}` }
        }).then(res => res.deletedCount);
      } else if (col.name === 'NotificationRecipient') {
        deletedCount = await NotificationRecipientModel.deleteMany({
          $or: [
            { email: { $regex: `^${SEED_PREFIX}` } },
            { email: { $in: seededUserEmails } }
          ]
        }).then(res => res.deletedCount);
      } else if (col.name === 'Cart' || col.name === 'Review') {
        // For carts and reviews, we delete those associated with seeded users
        const seededUsers = await UserModel.find({
          $or: [
            { name: { $regex: `^${SEED_PREFIX}` } },
            { email: { $in: seededUserEmails } }
          ]
        }).select('_id');
        const userIds = seededUsers.map(u => u._id);
        
        deletedCount = await (col.model as any).deleteMany({
          user: { $in: userIds }
        }).then((res: any) => res.deletedCount);
      } else {
        // Regular name-based prefix match
        deletedCount = await (col.model as any).deleteMany({
          [col.field]: { $regex: `^${SEED_PREFIX}` }
        }).then((res: any) => res.deletedCount);
      }

      results[col.name] = deletedCount;
      logger.info(`Deleted ${deletedCount} records from ${col.name}.`);
    }

    logger.info('Cleanup summary:');
    console.table(results);
    logger.info('Database cleanup completed successfully!');
  } catch (error) {
    logger.error({ error }, 'Database cleanup failed');
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

cleanup();
