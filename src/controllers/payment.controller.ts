import { Request, Response } from 'express';
import Stripe from 'stripe';
import * as stripeService from '../services/stripe.service';
import Attendee from '../models/attendee.model';
import Vendor from '../models/vendor.model';
import asyncHandler from '../utils/asyncHandler';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';
import logger from '../utils/logger';

/**
 * POST /api/v1/payments/webhook
 * Stripe Webhook Handler for asynchronous fulfillment
 */
export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'];

  let event: Stripe.Event;
  try {
    event = stripeService.constructWebhookEvent(req.body, sig);
  } catch (err: any) {
    logger.warn(`Stripe Webhook Signature Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  logger.info(`Received Stripe webhook event: ${event.type} [${event.id}]`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};
      const regType = metadata.type;
      const refCode = metadata.refCode;
      const paymentIntentId =
        typeof session.payment_intent === 'string'
          ? session.payment_intent
          : (session.payment_intent as any)?.id || null;

      if (regType === 'attendee' && refCode) {
        const attendee = await Attendee.findOne({ refCode });
        if (attendee) {
          if (attendee.paymentStatus !== 'paid') {
            attendee.paymentStatus = 'paid';
            attendee.stripePaymentIntentId = paymentIntentId;
            attendee.paidAt = new Date();
            if (session.amount_total) {
              attendee.pricePaid = session.amount_total / 100;
            }
            await attendee.save();
            logger.info(
              `Payment confirmed for Attendee ${attendee.fullName} (${attendee.refCode})`
            );
          } else {
            logger.info(`Attendee ${attendee.refCode} already marked as paid.`);
          }
        } else {
          logger.warn(`Attendee with refCode ${refCode} not found for webhook session.`);
        }
      } else if (regType === 'vendor' && refCode) {
        const vendor = await Vendor.findOne({ refCode });
        if (vendor) {
          if (vendor.paymentStatus !== 'paid') {
            vendor.paymentStatus = 'paid';
            vendor.status = 'approved';
            vendor.stripePaymentIntentId = paymentIntentId;
            vendor.paidAt = new Date();
            if (session.amount_total) {
              vendor.pricePaid = session.amount_total / 100;
            }
            await vendor.save();
            logger.info(
              `Payment confirmed for Vendor ${vendor.businessName} (${vendor.refCode})`
            );
          } else {
            logger.info(`Vendor ${vendor.refCode} already marked as paid.`);
          }
        } else {
          logger.warn(`Vendor with refCode ${refCode} not found for webhook session.`);
        }
      }
      break;
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};
      const refCode = metadata.refCode;

      if (metadata.type === 'attendee' && refCode) {
        await Attendee.updateOne(
          { refCode, paymentStatus: 'pending' },
          { paymentStatus: 'failed' }
        );
        logger.info(`Attendee checkout session expired for refCode: ${refCode}`);
      } else if (metadata.type === 'vendor' && refCode) {
        await Vendor.updateOne(
          { refCode, paymentStatus: 'pending' },
          { paymentStatus: 'failed' }
        );
        logger.info(`Vendor checkout session expired for refCode: ${refCode}`);
      }
      break;
    }

    default:
      logger.debug(`Unhandled Stripe event type: ${event.type}`);
  }

  res.status(200).json({ received: true });
};

/**
 * GET /api/v1/payments/verify-session/:sessionId
 * Allows the frontend return page to verify checkout session status and display passes
 */
export const verifySession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.params;

  if (!sessionId) {
    throw new ApiError(400, 'Session ID is required');
  }

  // Check Attendee by session ID
  let attendee = await Attendee.findOne({ stripeSessionId: sessionId });
  if (attendee) {
    if (attendee.paymentStatus !== 'paid' && !sessionId.startsWith('mock_session_')) {
      const stripeSession = await stripeService.retrieveCheckoutSession(sessionId);
      if (stripeSession && stripeSession.payment_status === 'paid') {
        attendee.paymentStatus = 'paid';
        attendee.paidAt = new Date();
        attendee.stripePaymentIntentId =
          typeof stripeSession.payment_intent === 'string'
            ? stripeSession.payment_intent
            : null;
        await attendee.save();
      }
    }

    res.status(200).json(
      new ApiResponse(
        200,
        {
          type: 'attendee',
          refCode: attendee.refCode,
          fullName: attendee.fullName,
          email: attendee.email,
          ticketType: attendee.ticketType,
          paymentStatus: attendee.paymentStatus,
          fastTrackPass: attendee.fastTrackPass,
          pricePaid: attendee.pricePaid,
        },
        'Attendee payment verification completed'
      )
    );
    return;
  }

  // Check Vendor by session ID
  let vendor = await Vendor.findOne({ stripeSessionId: sessionId });
  if (vendor) {
    if (vendor.paymentStatus !== 'paid' && !sessionId.startsWith('mock_session_')) {
      const stripeSession = await stripeService.retrieveCheckoutSession(sessionId);
      if (stripeSession && stripeSession.payment_status === 'paid') {
        vendor.paymentStatus = 'paid';
        vendor.status = 'approved';
        vendor.paidAt = new Date();
        vendor.stripePaymentIntentId =
          typeof stripeSession.payment_intent === 'string'
            ? stripeSession.payment_intent
            : null;
        await vendor.save();
      }
    }

    res.status(200).json(
      new ApiResponse(
        200,
        {
          type: 'vendor',
          refCode: vendor.refCode,
          businessName: vendor.businessName,
          email: vendor.email,
          paymentTier: vendor.paymentTier,
          paymentStatus: vendor.paymentStatus,
          status: vendor.status,
          pricePaid: vendor.pricePaid,
          qrCode: vendor.qrCode,
          publicProfileUrl: vendor.publicProfileUrl,
        },
        'Vendor payment verification completed'
      )
    );
    return;
  }

  // If not found by stripeSessionId, check if it's a valid Stripe session directly
  if (!sessionId.startsWith('mock_session_')) {
    const session = await stripeService.retrieveCheckoutSession(sessionId);
    if (session && session.metadata?.refCode) {
      const refCode = session.metadata.refCode;
      if (session.metadata.type === 'attendee') {
        const foundAtt = await Attendee.findOne({ refCode });
        if (foundAtt) {
          if (session.payment_status === 'paid' && foundAtt.paymentStatus !== 'paid') {
            foundAtt.paymentStatus = 'paid';
            foundAtt.stripeSessionId = sessionId;
            foundAtt.paidAt = new Date();
            await foundAtt.save();
          }
          res.status(200).json(
            new ApiResponse(
              200,
              {
                type: 'attendee',
                refCode: foundAtt.refCode,
                fullName: foundAtt.fullName,
                paymentStatus: foundAtt.paymentStatus,
                ticketType: foundAtt.ticketType,
              },
              'Attendee payment verification completed'
            )
          );
          return;
        }
      } else if (session.metadata.type === 'vendor') {
        const foundVnd = await Vendor.findOne({ refCode });
        if (foundVnd) {
          if (session.payment_status === 'paid' && foundVnd.paymentStatus !== 'paid') {
            foundVnd.paymentStatus = 'paid';
            foundVnd.status = 'approved';
            foundVnd.stripeSessionId = sessionId;
            foundVnd.paidAt = new Date();
            await foundVnd.save();
          }
          res.status(200).json(
            new ApiResponse(
              200,
              {
                type: 'vendor',
                refCode: foundVnd.refCode,
                businessName: foundVnd.businessName,
                paymentStatus: foundVnd.paymentStatus,
                status: foundVnd.status,
                qrCode: foundVnd.qrCode,
              },
              'Vendor payment verification completed'
            )
          );
          return;
        }
      }
    }
  }

  throw new ApiError(404, `No registration found matching checkout session ${sessionId}`);
});

