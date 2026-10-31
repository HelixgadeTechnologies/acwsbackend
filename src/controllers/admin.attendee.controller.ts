import { Request, Response } from 'express';
import * as attendeeService from '../services/attendee.service';
import asyncHandler from '../utils/asyncHandler';
import ApiResponse from '../utils/ApiResponse';
import { extractDeviceInfo } from '../utils/device.util';

/**
 * GET /api/v1/admin/attendees
 * Retrieve paginated attendees with search and filtering
 */
export const getAttendees = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const result = await attendeeService.getAdminAttendees(req.query as any);
  res.status(200).json(new ApiResponse(200, result, 'Attendees retrieved successfully'));
});

/**
 * PATCH /api/v1/admin/attendees/:id/checkin
 * Toggle or update attendee check-in status (accepts MongoDB _id OR refCode)
 */
export const checkinAttendee = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const explicitStatus = req.body.checkedIn;
    const deviceInfo = extractDeviceInfo(req);
    const attendee = await attendeeService.checkinAttendee(
      req.params.id,
      explicitStatus,
      deviceInfo
    );
    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          attendee,
          `Attendee ${attendee.fullName} is now ${attendee.checkedIn ? 'checked in' : 'unchecked'}`
        )
      );
  }
);

/**
 * POST /api/v1/admin/attendees/batch
 * Batch import attendees from external systems or CSV imports
 */
export const batchImportAttendees = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const { attendees } = req.body;
    const result = await attendeeService.batchImportAttendees(attendees);
    res
      .status(201)
      .json(
        new ApiResponse(
          201,
          result,
          `Successfully imported ${result.count} attendee(s)`
        )
      );
  }
);
