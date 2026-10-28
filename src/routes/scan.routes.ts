import { Router } from 'express';
import * as scanController from '../controllers/scan.controller';

const router = Router();

/**
 * @route   GET /api/v1/scan/:refCode
 * @desc    Universal unauthenticated QR Code scanner route (resolves Attendee or Vendor)
 * @access  Public (Unauthenticated)
 */
router.get('/:refCode', scanController.scanRefCode);

export default router;

