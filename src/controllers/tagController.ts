import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { TagModel } from '../models/Tag';
import { createSlug } from '../utils/slug';

export const listTags = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const tags = await TagModel.find().sort({ name: 1 });
  res.json({ success: true, data: tags });
});

export const createTag = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body as { name: string };
  const tag = await TagModel.create({
    name,
    slug: createSlug(name)
  });
  res.status(201).json({ success: true, data: tag });
});

export const updateTag = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tag = await TagModel.findById(req.params.tagId);
  if (!tag) {
    throw new ApiError(404, 'Tag not found');
  }

  const { name, isActive } = req.body as { name?: string; isActive?: boolean };
  if (name !== undefined) {
    tag.name = name;
    tag.slug = createSlug(name);
  }
  if (typeof isActive === 'boolean') tag.isActive = isActive;

  await tag.save();
  res.json({ success: true, data: tag });
});

export const deleteTag = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const tag = await TagModel.findById(req.params.tagId);
  if (!tag) {
    throw new ApiError(404, 'Tag not found');
  }
  await tag.deleteOne();
  res.json({ success: true, message: 'Tag deleted successfully' });
});

