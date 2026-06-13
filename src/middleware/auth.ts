import { NextFunction, Request, Response } from 'express';
import { auth } from '../lib/auth';
import { ApiError } from '../utils/ApiError';

export interface AuthRequest extends Request {
  user?: any;
  session?: any;
}

const getHeaders = (req: Request) => {
  const headers = new Headers();
  Object.entries(req.headers).forEach(([key, value]) => {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach(v => headers.append(key, v));
      } else {
        headers.set(key, value);
      }
    }
  });
  return headers;
};

export const requireAuth = async (req: AuthRequest): Promise<void> => {
  const session = await auth.api.getSession({
    headers: getHeaders(req),
  });

  if (!session) {
    throw new ApiError(401, 'Authentication required');
  }

  req.user = session.user;
  req.session = session.session;
};

export const requireVerifiedUser = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    await requireAuth(req);
    if (!req.user) {
        throw new ApiError(401, 'Authentication required');
    }
    
    if (req.user.role === 'admin') {
      return next();
    }
 
    if (!req.user.emailVerified) {
      throw new ApiError(403, 'Please verify your email to access this feature');
    }
 
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    await requireAuth(req);
    if (!req.user || req.user.role !== 'admin') {
      throw new ApiError(403, 'Administrator access required');
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const session = await auth.api.getSession({
      headers: getHeaders(req),
    });

    if (session) {
      req.user = session.user;
      req.session = session.session;
    }
    next();
  } catch {
    next();
  }
};
