import { Request, Response } from 'express';
import * as itemService from '../services/item.service';
import asyncHandler from '../utils/asyncHandler';
import ApiResponse from '../utils/ApiResponse';

/**
 * GET /api/v1/items
 */
export const getAllItems = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query['page'] as string, 10) || 1;
  const limit = parseInt(req.query['limit'] as string, 10) || 10;

  const result = await itemService.getAllItems(req.user!._id.toString(), { page, limit });
  res.status(200).json(new ApiResponse(200, result, 'Items fetched successfully'));
});

/**
 * GET /api/v1/items/:id
 */
export const getItemById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const item = await itemService.getItemById(req.params['id']!, req.user!._id.toString());
  res.status(200).json(new ApiResponse(200, { item }, 'Item fetched successfully'));
});

/**
 * POST /api/v1/items
 */
export const createItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const item = await itemService.createItem(req.body, req.user!._id.toString());
  res.status(201).json(new ApiResponse(201, { item }, 'Item created successfully'));
});

/**
 * PUT /api/v1/items/:id
 */
export const updateItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const item = await itemService.updateItem(req.params['id']!, req.body, req.user!._id.toString());
  res.status(200).json(new ApiResponse(200, { item }, 'Item updated successfully'));
});

/**
 * DELETE /api/v1/items/:id
 */
export const deleteItem = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  await itemService.deleteItem(req.params['id']!, req.user!._id.toString());
  res.status(200).json(new ApiResponse(200, null, 'Item deleted successfully'));
});
