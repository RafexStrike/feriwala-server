import mongoose from 'mongoose';
import { ENV } from './environment';
import { logger } from './logger';

export const connectDB = async (): Promise<void> => {
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(ENV.MONGODB_URI);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error({ error }, 'MongoDB connection failed');
    process.exit(1);
  }
};
