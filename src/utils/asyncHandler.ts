import { NextFunction, Request, RequestHandler, Response } from 'express';

export const asyncHandler = (handler: (req: Request, res: Response, next: NextFunction) => Promise<void> | void): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
