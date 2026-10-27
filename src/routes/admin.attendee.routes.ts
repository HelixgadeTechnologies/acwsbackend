import { Router } from 'express';
import * as adminAttendeeController from '../controllers/admin.attendee.controller';
import { protectAdmin } from '../middlewares/auth.middleware';
import validate from '../middlewares/validate.middleware';
import {
  attendeeQuerySchema,
  batchAttendeesSchema,
} from './schemas/attendee.schema';

const router = Router();

// Protect all admin attendee routes
router.use(protectAdmin);

/**
 * @route   GET /api/v1/admin/attendees
 * @desc    Get paginated attendee list with search & filter
 * @access  Admin only
 */
router.get('/', validate(attendeeQuerySchema, 'query'), adminAttendeeController.getAttendees);

/**
 * @route   PATCH /api/v1/admin/attendees/:id/checkin
 * @desc    Toggle or set attendee check-in status (by _id or refCode)
 * @access  Admin only
 */
router.patch('/:id/checkin', adminAttendeeController.checkinAttendee);

/**
 * @route   POST /api/v1/admin/attendees/batch
 * @desc    Batch import attendees (from CSV or external ticket platforms)
 * @access  Admin only
 */
router.post('/batch', validate(batchAttendeesSchema), adminAttendeeController.batchImportAttendees);

export default router;
