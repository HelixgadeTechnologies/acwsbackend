import { Router } from 'express';
import * as scanController from '../controllers/scan.controller';

const router = Router();

/**
 * @route   GET /api/v1/scan/:refCode/logs
 * @desc    Get scan audit device history and metrics for a pass or booth
 * @access  Public (Unauthenticated)
 */
router.get('/:refCode/logs', scanController.getScanHistory);

/**
 * @route   GET /api/v1/scan/:refCode
 * @desc    Universal unauthenticated QR Code scanner route (resolves Attendee or Vendor)
 * @access  Public (Unauthenticated)
 */
router.get('/:refCode', scanController.scanRefCode);

export default router;

