import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';

const router = Router();

/**
 * @route   GET /api/v1/payments/verify-session/:sessionId
 * @desc    Verify checkout session outcome and retrieve registration pass details
 * @access  Public
 */
router.get('/verify-session/:sessionId', paymentController.verifySession);

/**
 * @route   GET /api/v1/payments/success
 * @desc    Return destination after Stripe checkout payment completion
 * @access  Public
 */
router.get('/success', paymentController.handlePaymentSuccess);

/**
 * @route   GET /api/v1/payments/cancelled
 * @desc    Return destination if user cancels Stripe checkout
 * @access  Public
 */
router.get('/cancelled', paymentController.handlePaymentCancelled);

export default router;

