import { Request, Response } from 'express';
import * as attendeeService from '../services/attendee.service';
import asyncHandler from '../utils/asyncHandler';
import ApiResponse from '../utils/ApiResponse';

/**
 * POST /api/v1/attendees
 * Public registration endpoint for ticket buyers and intending couples
 */
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const attendee = await attendeeService.registerAttendee(req.body);

  res.status(201).json(
    new ApiResponse(
      201,
      {
        attendee,
        refCode: attendee.refCode,
      },
      `Ticket registration confirmed successfully. Your pass reference code is ${attendee.refCode}`
    )
  );
});
