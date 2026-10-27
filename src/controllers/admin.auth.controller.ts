import { Request, Response } from 'express';
import * as adminAuthService from '../services/admin.auth.service';
import asyncHandler from '../utils/asyncHandler';
import ApiResponse from '../utils/ApiResponse';

/**
 * POST /api/v1/admin/login
 * Admin login endpoint
 */
export const adminLogin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await adminAuthService.loginAdmin(req.body);
  res.status(200).json(new ApiResponse(200, result, 'Admin authenticated successfully'));
});

/**
 * GET /api/v1/admin/me
 * Retrieve current authenticated admin profile
 */
export const getAdminMe = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const admin = req.admin || req.user;
  res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
      },
      'Admin profile retrieved'
    )
  );
});
