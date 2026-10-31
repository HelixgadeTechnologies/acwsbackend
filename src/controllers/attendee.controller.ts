import { Request, Response } from 'express';
import * as attendeeService from '../services/attendee.service';
import asyncHandler from '../utils/asyncHandler';
import ApiResponse from '../utils/ApiResponse';
import { extractDeviceInfo } from '../utils/device.util';
import { recordScanEvent } from '../services/scanLog.service';

/**
 * POST /api/v1/attendees
 * Public registration endpoint for ticket buyers and intending couples
 */
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const deviceInfo = extractDeviceInfo(req);
  const result = await attendeeService.registerAttendee({
    ...req.body,
    registrationDevice: deviceInfo,
  });

  const message = result.checkoutUrl
    ? `Ticket registration initiated. Please complete payment to confirm pass (Ref: ${result.refCode})`
    : `Ticket registration confirmed successfully. Your pass reference code is ${result.refCode}`;

  res.status(201).json(
    new ApiResponse(
      201,
      {
        attendee: result.attendee,
        refCode: result.refCode,
        qrCode: result.qrCode,
        publicPassUrl: result.publicPassUrl,
        checkoutUrl: result.checkoutUrl,
        sessionId: result.sessionId,
      },
      message
    )
  );
});

/**
 * GET /api/v1/attendees/public/:refCode
 * Public unauthenticated JSON endpoint returning attendee ticket pass info
 */
export const getPublicProfile = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const profile = await attendeeService.getPublicAttendeeProfile(req.params.refCode);
    recordScanEvent(req.params.refCode, extractDeviceInfo(req)).catch(() => {});
    res
      .status(200)
      .json(new ApiResponse(200, profile, 'Attendee pass details retrieved successfully'));
  }
);

/**
 * GET /api/v1/attendees/public/:refCode/pass
 * Public unauthenticated responsive HTML Digital Admission Pass
 */
export const getAttendeePass = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const profile = await attendeeService.getPublicAttendeeProfile(req.params.refCode);
    recordScanEvent(req.params.refCode, extractDeviceInfo(req)).catch(() => {});
    const html = attendeeService.renderAttendeePassHtml(profile);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(html);
  }
);
