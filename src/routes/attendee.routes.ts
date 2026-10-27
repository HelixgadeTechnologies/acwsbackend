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

export default router;
