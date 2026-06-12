import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { UserModel } from '../models/User';

const sanitizeUser = (user: any) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  emailVerified: user.emailVerified,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

export const listUsers = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const users = await UserModel.find().sort({ createdAt: -1 });
  res.json({ success: true, data: users.map(sanitizeUser) });
});

export const getMe = asyncHandler(async (req: any, res: Response): Promise<void> => {
  res.json({ success: true, data: sanitizeUser(req.user!) });
});

export const getUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await UserModel.findById(req.params.userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  res.json({ success: true, data: sanitizeUser(user) });
});

export const updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await UserModel.findById(req.params.userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const { name, email, role } = req.body as {
    name?: string;
    email?: string;
    role?: 'user' | 'admin';
  };

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (role !== undefined) user.role = role;

  await user.save();
  res.json({ success: true, data: sanitizeUser(user) });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const user = await UserModel.findById(req.params.userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  await UserModel.findByIdAndDelete(req.params.userId);
  res.json({ success: true, message: 'User deleted successfully' });
});
