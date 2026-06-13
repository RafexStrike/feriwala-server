import { NextFunction, Request, Response } from 'express';
import { MulterError } from 'multer';
import { ApiError } from '../utils/ApiError';
import { logger } from '../config/logger';

export const notFound = (_req: Request, _res: Response, next: NextFunction): void => {
  next(new ApiError(404, 'Route not found'));
};

export const errorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  let apiError: ApiError;

  if (error instanceof ApiError) {
    apiError = error;
  } else if (error instanceof MulterError) {
    apiError = new ApiError(400, error.message, error);
  } else if (error instanceof Error && error.message === 'Only image uploads are allowed') {
    apiError = new ApiError(400, error.message, error);
  } else if (typeof error === 'object' && error && (error as { code?: number }).code === 11000) {
    apiError = new ApiError(409, 'Duplicate resource', error);
  } else {
    apiError = new ApiError(500, 'Internal server error', error);
  }

  const safeError = (err: unknown) => {
    if (err instanceof Error) {
      return { message: err.message, stack: err.stack };
    }
    return err;
  };

  logger.error({ error: safeError(error) }, apiError.message);
  res.status(apiError.statusCode).json({
    success: false,
    message: apiError.message,
    details: apiError.details
  });
};
