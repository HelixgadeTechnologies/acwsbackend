import { Request, Response } from 'express';
import * as vendorService from '../services/vendor.service';
import asyncHandler from '../utils/asyncHandler';
import ApiResponse from '../utils/ApiResponse';
import { extractDeviceInfo } from '../utils/device.util';
import { recordScanEvent } from '../services/scanLog.service';

/**
 * POST /api/v1/vendors/register
 * Public registration endpoint for exhibitors/vendors
 */
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const deviceInfo = extractDeviceInfo(req);
  const result = await vendorService.registerVendor({
    ...req.body,
    registrationDevice: deviceInfo,
  });

  const message = result.checkoutUrl
    ? `Exhibitor registration initiated. Please complete payment to confirm exhibition stand (Ref: ${result.refCode})`
    : `Exhibitor registration submitted successfully. Your reference code is ${result.refCode}`;

  res.status(201).json(
    new ApiResponse(
      201,
      {
        vendor: result.vendor,
        refCode: result.refCode,
        qrCode: result.qrCode,
        publicProfileUrl: result.publicProfileUrl,
        checkoutUrl: result.checkoutUrl,
        sessionId: result.sessionId,
      },
      message
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
    recordScanEvent(req.params.refCode, extractDeviceInfo(req)).catch(() => {});
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
    recordScanEvent(req.params.refCode, extractDeviceInfo(req)).catch(() => {});
    const html = vendorService.renderVendorCardHtml(profile);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  }
);
