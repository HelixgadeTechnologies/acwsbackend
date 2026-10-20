import { Types } from 'mongoose';
import Item from '../models/item.model';
import ApiError from '../utils/ApiError';
import {
  IItem,
  CreateItemInput,
  UpdateItemInput,
  PaginationOptions,
  PaginatedItems,
} from '../interfaces/item.interface';

/**
 * Fetch all items belonging to the authenticated user with pagination.
 */
export const getAllItems = async (
  ownerId: Types.ObjectId | string,
  { page = 1, limit = 10 }: PaginationOptions = {}
): Promise<PaginatedItems> => {
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Item.find({ owner: ownerId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Item.countDocuments({ owner: ownerId }),
  ]);

  return { items, total, page, pages: Math.ceil(total / limit) };
};

/**
 * Get a single item by ID scoped to the requesting user.
 */
export const getItemById = async (
  id: string,
  ownerId: Types.ObjectId | string
): Promise<IItem> => {
  const item = await Item.findOne({ _id: id, owner: ownerId });
  if (!item) throw new ApiError(404, 'Item not found');
  return item;
};

/**
 * Create a new item for the authenticated user.
 */
export const createItem = async (
  data: CreateItemInput,
  ownerId: Types.ObjectId | string
): Promise<IItem> => {
  return Item.create({ ...data, owner: ownerId });
};

/**
 * Update an item — only if it belongs to the requesting user.
 */
export const updateItem = async (
  id: string,
  data: UpdateItemInput,
  ownerId: Types.ObjectId | string
): Promise<IItem> => {
  const item = await Item.findOneAndUpdate(
    { _id: id, owner: ownerId },
    data,
    { new: true, runValidators: true }
  );
  if (!item) throw new ApiError(404, 'Item not found');
  return item;
};

/**
 * Delete an item — only if it belongs to the requesting user.
 */
export const deleteItem = async (
  id: string,
  ownerId: Types.ObjectId | string
): Promise<void> => {
  const item = await Item.findOneAndDelete({ _id: id, owner: ownerId });
  if (!item) throw new ApiError(404, 'Item not found');
};
