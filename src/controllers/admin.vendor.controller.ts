import { Request, Response } from 'express';
import * as vendorService from '../services/vendor.service';
import * as authService from '../services/auth.service';
import asyncHandler from '../utils/asyncHandler';
import ApiResponse from '../utils/ApiResponse';

/**
 * POST /api/v1/admin/login
 * Admin authentication endpoint
 */
export const adminLogin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { user, token } = await authService.adminLogin(req.body);
  res.status(200).json(new ApiResponse(200, { user, token }, 'Admin authenticated successfully'));
});

/**
 * GET /api/v1/admin/vendors
 * Retrieve paginated vendor submissions with search and filter
 */
export const getVendors = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await vendorService.getAdminVendors(req.query as any);
  res.status(200).json(new ApiResponse(200, result, 'Vendors retrieved successfully'));
});

/**
 * GET /api/v1/admin/vendors/summary/stats
 * Aggregate vendor metrics by status, tier, and category
 */
export const getVendorStats = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
  const stats = await vendorService.getVendorStats();
  res.status(200).json(new ApiResponse(200, stats, 'Vendor statistics retrieved successfully'));
});

/**
 * GET /api/v1/admin/vendors/:id
 * Retrieve single vendor full submission breakdown
 */
export const getVendorById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const vendor = await vendorService.getVendorById(req.params.id);
  res.status(200).json(new ApiResponse(200, { vendor }, 'Vendor details retrieved successfully'));
});

/**
 * PATCH /api/v1/admin/vendors/:id/status
 * Update vendor application review status
 */
export const updateVendorStatus = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const vendor = await vendorService.updateVendorStatus(req.params.id, req.body.status);
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { vendor },
          `Vendor status updated to "${req.body.status}" successfully`
        )
      );
  }
);
