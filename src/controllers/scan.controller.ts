import { Request, Response } from 'express';
import * as attendeeService from '../services/attendee.service';
import * as vendorService from '../services/vendor.service';
import asyncHandler from '../utils/asyncHandler';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';

/**
 * GET /api/v1/scan/:refCode
 * Unified unauthenticated QR code scan endpoint
 * Automatically resolves both Attendee passes and Vendor exhibitor cards
 */
export const scanRefCode = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const refCode = (req.params.refCode || '').toUpperCase().trim();

  if (!refCode) {
    throw new ApiError(400, 'Reference code is required');
  }

  const acceptsHtml = req.accepts(['html', 'json']) === 'html';
  const isAttendeeCode = refCode.includes('ATT');
  const isVendorCode = refCode.includes('VND');

  // If code pattern indicates Attendee, check Attendee first
  if (isAttendeeCode || !isVendorCode) {
    try {
      const attendee = await attendeeService.getPublicAttendeeProfile(refCode);
      if (acceptsHtml) {
        const html = attendeeService.renderAttendeePassHtml(attendee);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.status(200).send(html);
        return;
      }
      res.status(200).json(
        new ApiResponse(
          200,
          { type: 'attendee', profile: attendee },
          'Attendee pass retrieved successfully'
        )
      );
      return;
    } catch (err: any) {
      if (isAttendeeCode) {
        throw err;
      }
      // If code was ambiguous, fall through to check Vendor
    }
  }

  // Check Vendor
  const vendor = await vendorService.getPublicVendorProfile(refCode);
  if (acceptsHtml) {
    const html = vendorService.renderVendorCardHtml(vendor);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
    return;
  }

  res.status(200).json(
    new ApiResponse(
      200,
      { type: 'vendor', profile: vendor },
      'Vendor profile retrieved successfully'
    )
  );
});

