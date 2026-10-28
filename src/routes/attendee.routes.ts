import { Router } from 'express';
import * as attendeeController from '../controllers/attendee.controller';
import validate from '../middlewares/validate.middleware';
import { createAttendeeSchema } from './schemas/attendee.schema';

const router = Router();

/**
 * @route   POST /api/v1/attendees and POST /api/v1/attendees/register
 * @desc    Public ticket buyer and intending-couple registration
 * @access  Public
 */
router.post('/', validate(createAttendeeSchema), attendeeController.register);
router.post('/register', validate(createAttendeeSchema), attendeeController.register);

/**
 * @route   GET /api/v1/attendees/public/:refCode
 * @desc    Get public attendee ticket details by reference code
 * @access  Public (Unauthenticated)
 */
router.get('/public/:refCode', attendeeController.getPublicProfile);

/**
 * @route   GET /api/v1/attendees/public/:refCode/pass
 * @desc    Direct mobile-friendly Digital Admission Pass view
 * @access  Public (Unauthenticated)
 */
router.get('/public/:refCode/pass', attendeeController.getAttendeePass);

export default router;
