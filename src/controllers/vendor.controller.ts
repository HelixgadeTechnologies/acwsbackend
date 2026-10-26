import { Request, Response } from 'express';
import * as vendorService from '../services/vendor.service';
import asyncHandler from '../utils/asyncHandler';
import ApiResponse from '../utils/ApiResponse';

/**
 * POST /api/v1/vendors/register
 * Public registration endpoint for exhibitors/vendors
 */
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const vendor = await vendorService.registerVendor(req.body);

  res.status(201).json(
    new ApiResponse(
      201,
      {
        vendor,
        refCode: vendor.refCode,
        qrCode: vendor.qrCode,
        publicProfileUrl: vendor.publicProfileUrl,
      },
      'Exhibitor registration submitted successfully. Your reference code is ' + vendor.refCode
    )
  );
});

/**
 * GET /api/v1/vendors/public/:refCode
 * Public unauthenticated JSON endpoint returning vendor contact info
 */
export const getPublicProfile = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const profile = await vendorService.getPublicVendorProfile(req.params.refCode);
    res.status(200).json(new ApiResponse(200, profile, 'Exhibitor profile retrieved successfully'));
  }
);

/**
 * GET /api/v1/vendors/public/:refCode/card
 * Public unauthenticated responsive HTML Digital Business Card
 */
export const getVendorCard = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const profile = await vendorService.getPublicVendorProfile(req.params.refCode);
    const html = vendorService.renderVendorCardHtml(profile);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  }
);
