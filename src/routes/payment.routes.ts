import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';

const router = Router();

/**
 * @route   GET /api/v1/payments/verify-session/:sessionId
 * @desc    Verify checkout session outcome and retrieve registration pass details
 * @access  Public
 */
router.get('/verify-session/:sessionId', paymentController.verifySession);

export default router;

