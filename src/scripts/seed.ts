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
import { auth } from '../lib/auth';
import slugify from 'slugify';

const SEED_PREFIX = 'AUTOSEED_';

async function seed() {
  try {
    await connectDB();
    logger.info('Starting database seeding...');

    // 1. Seed Categories
    const categoryNames = ['Electronics', 'Clothing', 'Home & Kitchen', 'Books', 'Beauty & Health', 'Sports', 'Toys', 'Automotive'];
    const categories = await Promise.all(
      categoryNames.map(async (name) => {
        const fullName = `${SEED_PREFIX}${name}`;
        return await CategoryModel.findOneAndUpdate(
          { slug: slugify(fullName, { lower: true }) },
          {
            name: fullName,
            slug: slugify(fullName, { lower: true }),
            description: `Realistic description for ${fullName} category.`,
            isActive: true,
          },
          { upsert: true, returnDocument: 'after' }
        );
      })
    );
    logger.info(`Seeded ${categories.length} categories.`);

    // 2. Seed Tags
    const tagNames = ['New Arrival', 'Best Seller', 'Eco-Friendly', 'Premium', 'Discounted', 'Limited Edition', 'Trending', 'Handmade'];
    const tags = await Promise.all(
      tagNames.map(async (name) => {
        const fullName = `${SEED_PREFIX}${name}`;
        return await TagModel.findOneAndUpdate(
          { slug: slugify(fullName, { lower: true }) },
          {
            name: fullName,
            slug: slugify(fullName, { lower: true }),
            isActive: true,
          },
          { upsert: true, returnDocument: 'after' }
        );
      })
    );
    logger.info(`Seeded ${tags.length} tags.`);

    // 3. Seed Products
    const productTypes = ['Smartphone', 'Laptop', 'Headphones', 'T-Shirt', 'Jeans', 'Blender', 'Vacuum', 'Novel', 'Textbook', 'Lipstick', 'Moisturizer', 'Yoga Mat', 'Dumbbells', 'Tire', 'Oil Filter'];
    const products = [];
    for (let i = 1; i <= 60; i++) {
      const type = productTypes[i % productTypes.length];
      const name = `${SEED_PREFIX}${type}_${i}`;
      
      // Randomly assign 1-3 categories and 1-3 tags
      const productCategories = categories.slice(
        Math.floor(Math.random() * categories.length),
        Math.floor(Math.random() * categories.length) + 2
      );
      const productTags = tags.slice(
        Math.floor(Math.random() * tags.length),
        Math.floor(Math.random() * tags.length) + 2
      );

      const product = await ProductModel.findOneAndUpdate(
        { name },
        {
          name,
          briefDescription: `High-quality ${name} with great features.`,
          detailedDescription: `This is a detailed description for ${name}. It offers exceptional performance, durability, and value. Perfect for users who need a reliable ${type} for their daily activities.`,
          price: Math.floor(Math.random() * 1000) + 10,
          costPrice: Math.floor(Math.random() * 800) + 5,
          stock: Math.floor(Math.random() * 100) + 10,
          categories: productCategories.map(c => c._id),
          tags: productTags.map(t => t._id),
          images: [`https://picsum.photos/seed/${name}/400/400`, `https://picsum.photos/seed/${name}2/400/400`],
          isActive: true,
          averageRating: 0,
          reviewCount: 0,
        },
        { upsert: true, returnDocument: 'after' }
      );
      products.push(product);
    }
    logger.info(`Seeded ${products.length} products.`);

    // 4. Seed Users
    const testUserEmail = 'seed.user@example.com';
    const testUserName = `${SEED_PREFIX}TestUser`;
    const testUserPassword = 'TestPassword123!';

    try {
        await auth.api.signUpEmail({
            body: {
                email: testUserEmail,
                password: testUserPassword,
                name: testUserName,
            }
        });
    } catch (e) {
        // User likely already exists
    }

    // Ensure test user is verified and has correct role
    await UserModel.updateOne(
        { email: testUserEmail },
        { emailVerified: true, role: 'user' },
        { upsert: true }
    );

    // Other test users
    const otherUserEmails = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
    await Promise.all(
      otherUserEmails.map(async (email, idx) => {
        const name = `${SEED_PREFIX}User_${idx + 1}`;
        try {
            await auth.api.signUpEmail({
                body: {
                    email,
                    password: 'Password123!',
                    name,
                }
            });
        } catch (e) {
            // User likely already exists
        }
      })
    );
    
    // Verify other users
    await UserModel.updateMany(
        { email: { $in: otherUserEmails } },
        { emailVerified: true, role: 'user' }
    );

    const allUsers = await UserModel.find({
        $or: [
            { email: testUserEmail },
            { email: { $in: otherUserEmails } }
        ]
    });
    
    if (!allUsers || allUsers.length === 0) {
        throw new Error('No users were found/seeded. Database seeding cannot proceed without users.');
    }
    logger.info(`Seeded ${allUsers.length} users.`);


    // 5. Seed Reviews
    const reviews = [];
    for (const product of products) {
      const numReviews = Math.floor(Math.random() * 4);
      for (let i = 0; i < numReviews; i++) {
        const user = allUsers[Math.floor(Math.random() * allUsers.length)];
        const review = await ReviewModel.findOneAndUpdate(
          { user: user._id, product: product._id },
          {
            user: user._id,
            product: product._id,
            comment: `This ${product.name} is amazing! Really loved it.`,
            rating: Math.floor(Math.random() * 5) + 1,
          },
          { upsert: true, returnDocument: 'after' }
        );
        reviews.push(review);
      }
    }
    
    // Update product ratings
    for (const product of products) {
        const productReviews = await ReviewModel.find({ product: product._id });
        if (productReviews.length > 0) {
            const avg = productReviews.reduce((acc, r) => acc + r.rating, 0) / productReviews.length;
            await ProductModel.updateOne({ _id: product._id }, {
                averageRating: avg,
                reviewCount: productReviews.length
            });
        }
    }
    logger.info(`Seeded ${reviews.length} reviews.`);

    // 6. Seed Carts
    const carts = [];
    for (const user of allUsers) {
      const items = [];
      const numItems = Math.floor(Math.random() * 5);
      for (let i = 0; i < numItems; i++) {
        const product = products[Math.floor(Math.random() * products.length)];
        items.push({
          product: product._id,
          quantity: Math.floor(Math.random() * 3) + 1,
          priceSnapshot: product.price,
        });
      }
      
      const cart = await CartModel.findOneAndUpdate(
        { user: user._id },
        { user: user._id, items },
        { upsert: true, returnDocument: 'after' }
      );
      carts.push(cart);
    }
    logger.info(`Seeded ${carts.length} carts.`);

    // 7. Seed Orders
    const orders = [];
    for (const user of allUsers) {
      const numOrders = Math.floor(Math.random() * 3);
      for (let i = 0; i < numOrders; i++) {
        const items = [];
        const numItems = Math.floor(Math.random() * 4) + 1;
        let subtotal = 0;
        let profit = 0;

        for (let j = 0; j < numItems; j++) {
          const product = products[Math.floor(Math.random() * products.length)];
          const qty = Math.floor(Math.random() * 2) + 1;
          items.push({
            product: product._id,
            name: product.name,
            quantity: qty,
            price: product.price,
            costPrice: product.costPrice,
          });
          subtotal += product.price * qty;
          profit += (product.price - product.costPrice) * qty;
        }

        const total = subtotal; // No tax/shipping for simplicity
        const status = ['pending', 'completed', 'canceled'][Math.floor(Math.random() * 3)];

        const order = await OrderModel.create({
          user: user._id,
          items,
          status,
          subtotal,
          total,
          profit,
          shippingAddress: `${SEED_PREFIX}Address ${i+1}, City, Country`,
          customerEmail: user.email,
          statusHistory: [{
            status,
            note: 'Initial order status',
            changedAt: new Date(),
          }],
          notes: `Seed order ${i+1} for ${user.email}`,
        });
        orders.push(order);
      }
    }
    logger.info(`Seeded ${orders.length} orders.`);

    // 8. Seed Notification Recipients
    const recipients = await Promise.all(
      allUsers.map(async (user) => {
        return await NotificationRecipientModel.findOneAndUpdate(
          { email: user.email },
          {
            email: user.email,
            isActive: true,
            notificationTypes: ['order-status'],
            createdBy: user._id,
          },
          { upsert: true, returnDocument: 'after' }
        );
      })
    );
    logger.info(`Seeded ${recipients.length} notification recipients.`);

    logger.info('Database seeding completed successfully!');
  } catch (error) {
    logger.error({ error }, 'Database seeding failed');
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
}

seed();
