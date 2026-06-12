import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ProductModel } from '../models/Product';
import { CategoryModel } from '../models/Category';
import { TagModel } from '../models/Tag';
import { ReviewModel } from '../models/Review';

const parseObjectIdArray = (values: unknown): Types.ObjectId[] => {
  if (!Array.isArray(values)) {
    return [];
  }

  return values
    .filter((value): value is string => typeof value === 'string' && Types.ObjectId.isValid(value))
    .map((value) => new Types.ObjectId(value));
};

const briefProductProjection =
  'name briefDescription price stock categories tags images isActive averageRating reviewCount createdAt updatedAt';

export const listProducts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(Number(req.query.page ?? 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit ?? 12), 1), 100);
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const categoryId = typeof req.query.categoryId === 'string' ? req.query.categoryId : '';
  const tagId = typeof req.query.tagId === 'string' ? req.query.tagId : '';
  const isActive = req.query.isActive === 'false' ? false : true;

  const filter: any = { isActive };
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { briefDescription: { $regex: search, $options: 'i' } }
    ];
  }
  if (Types.ObjectId.isValid(categoryId)) {
    filter.categories = new Types.ObjectId(categoryId);
  }
  if (Types.ObjectId.isValid(tagId)) {
    filter.tags = new Types.ObjectId(tagId);
  }

  const [items, total] = await Promise.all([
    ProductModel.find(filter)
      .select(briefProductProjection)
      .populate('categories', 'name slug')
      .populate('tags', 'name slug')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ProductModel.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 }
  });
});

export const getProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const product = await ProductModel.findById(req.params.productId)
    .populate('categories', 'name slug')
    .populate('tags', 'name slug');

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const reviews = await ReviewModel.find({ product: product._id })
    .sort({ createdAt: -1 })
    .populate('user', 'name')
    .lean();

  res.json({
    success: true,
    data: {
      ...product.toObject(),
      reviews
    }
  });
});

export const createProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const {
    name,
    briefDescription,
    detailedDescription,
    price,
    costPrice,
    stock,
    categoryIds,
    tagIds,
    images
  } = req.body as Record<string, unknown>;

  const product = await ProductModel.create({
    name: String(name),
    briefDescription: String(briefDescription),
    detailedDescription: String(detailedDescription),
    price: Number(price),
    costPrice: Number(costPrice ?? 0),
    stock: Number(stock),
    categories: parseObjectIdArray(categoryIds),
    tags: parseObjectIdArray(tagIds),
    images: Array.isArray(images) ? images.map(String) : []
  });

  res.status(201).json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const product = await ProductModel.findById(req.params.productId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const {
    name,
    briefDescription,
    detailedDescription,
    price,
    costPrice,
    stock,
    categoryIds,
    tagIds,
    images,
    isActive
  } = req.body as Record<string, unknown>;

  if (name !== undefined) product.name = String(name);
  if (briefDescription !== undefined) product.briefDescription = String(briefDescription);
  if (detailedDescription !== undefined) product.detailedDescription = String(detailedDescription);
  if (price !== undefined) product.price = Number(price);
  if (costPrice !== undefined) product.costPrice = Number(costPrice);
  if (stock !== undefined) product.stock = Number(stock);
  if (categoryIds !== undefined) product.categories = parseObjectIdArray(categoryIds);
  if (tagIds !== undefined) product.tags = parseObjectIdArray(tagIds);
  if (images !== undefined) product.images = Array.isArray(images) ? images.map(String) : product.images;
  if (typeof isActive === 'boolean') product.isActive = isActive;

  await product.save();
  res.json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const product = await ProductModel.findById(req.params.productId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  product.isActive = false;
  await product.save();
  res.json({ success: true, message: 'Product deactivated successfully' });
});

export const updateInventory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const product = await ProductModel.findById(req.params.productId);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  const { stock } = req.body as { stock: number };
  product.stock = stock;
  await product.save();

  res.json({ success: true, data: product });
});
