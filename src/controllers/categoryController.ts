import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { CategoryModel } from '../models/Category';
import { createSlug } from '../utils/slug';

export const listCategories = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const categories = await CategoryModel.find().sort({ name: 1 });
  res.json({ success: true, data: categories });
});

export const createCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, description } = req.body as { name: string; description?: string };
  const category = await CategoryModel.create({
    name,
    description,
    slug: createSlug(name)
  });
  res.status(201).json({ success: true, data: category });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const category = await CategoryModel.findById(req.params.categoryId);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }

  const { name, description, isActive } = req.body as { name?: string; description?: string; isActive?: boolean };
  if (name !== undefined) {
    category.name = name;
    category.slug = createSlug(name);
  }
  if (description !== undefined) category.description = description;
  if (typeof isActive === 'boolean') category.isActive = isActive;

  await category.save();
  res.json({ success: true, data: category });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const category = await CategoryModel.findById(req.params.categoryId);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }
  await category.deleteOne();
  res.json({ success: true, message: 'Category deleted successfully' });
});

