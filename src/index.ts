import app from './app';
import { ENV } from './config/environment';
import { connectDB } from './config/db';
import { logger } from './config/logger';

const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(ENV.PORT, () => {
    logger.info(`Server running in ${ENV.NODE_ENV} mode on port ${ENV.PORT}`);
  });
};

void startServer();

