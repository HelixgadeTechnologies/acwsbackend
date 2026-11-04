import { Request, Response } from 'express';
import asyncHandler from '../utils/asyncHandler';
import ApiResponse from '../utils/ApiResponse';
import { getPublicPricing } from '../config/pricing';

/**
 * GET /api/v1/tickets/prices
 * Public endpoint returning authoritative ticket & vendor package pricing
 */
export const getPrices = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const pricing = getPublicPricing();
  res.status(200).json(new ApiResponse(200, pricing, 'Ticket and package pricing retrieved successfully'));
});
