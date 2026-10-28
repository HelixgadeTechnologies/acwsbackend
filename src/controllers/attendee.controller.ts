import { Request, Response } from 'express';
import * as attendeeService from '../services/attendee.service';
import asyncHandler from '../utils/asyncHandler';
import ApiResponse from '../utils/ApiResponse';

/**
 * POST /api/v1/attendees
 * Public registration endpoint for ticket buyers and intending couples
 */
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await attendeeService.registerAttendee(req.body);

  const message = result.checkoutUrl
    ? `Ticket registration initiated. Please complete payment to confirm pass (Ref: ${result.refCode})`
    : `Ticket registration confirmed successfully. Your pass reference code is ${result.refCode}`;

  res.status(201).json(
    new ApiResponse(
      201,
      {
        attendee: result.attendee,
        refCode: result.refCode,
        checkoutUrl: result.checkoutUrl,
        sessionId: result.sessionId,
      },
      message
    )
  );
});
