import { Request, Response } from 'express';
import Stripe from 'stripe';
import * as stripeService from '../services/stripe.service';
import * as attendeeService from '../services/attendee.service';
import * as vendorService from '../services/vendor.service';
import Attendee from '../models/attendee.model';
import Vendor from '../models/vendor.model';
import { IAttendee } from '../interfaces/attendee.interface';
import { IVendor } from '../interfaces/vendor.interface';
import PendingRegistration from '../models/pendingRegistration.model';
import asyncHandler from '../utils/asyncHandler';
import ApiResponse from '../utils/ApiResponse';
import ApiError from '../utils/ApiError';
import logger from '../utils/logger';

/**
 * POST /api/v1/payments/webhook
 * Stripe Webhook Handler for asynchronous payment fulfillment.
 * NOTE: Records are inserted into the permanent database ONLY upon successful payment.
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
      const amountPaid = session.amount_total ? session.amount_total / 100 : undefined;

      if (regType === 'attendee') {
        const attendee = await attendeeService.finalizeAttendeeRegistration(
          session.id,
          paymentIntentId,
          amountPaid,
          refCode
        );

        if (attendee) {
          logger.info(
            `Payment completed. Stored Attendee in database: ${attendee.fullName} (${attendee.refCode})`
          );
        } else {
          logger.warn(`No pending attendee registration found for session ${session.id}`);
        }
      } else if (regType === 'vendor') {
        const vendor = await vendorService.finalizeVendorRegistration(
          session.id,
          paymentIntentId,
          amountPaid,
          refCode
        );

        if (vendor) {
          logger.info(
            `Payment completed. Stored Vendor in database: ${vendor.businessName} (${vendor.refCode})`
          );
        } else {
          logger.warn(`No pending vendor registration found for session ${session.id}`);
        }
      }
      break;
    }

    case 'checkout.session.expired': {
      const session = event.data.object as Stripe.Checkout.Session;
      const metadata = session.metadata || {};
      const refCode = metadata.refCode;

      if (refCode) {
        await PendingRegistration.deleteOne({ refCode });
        logger.info(`Checkout session expired. Removed pending draft for refCode: ${refCode}`);
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
 * Allows the frontend return page to verify checkout session status and display passes.
 * If webhook has not yet processed the session, this finalizes and inserts the record into DB immediately.
 */
export const verifySession = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { sessionId } = req.params;

  if (!sessionId) {
    throw new ApiError(400, 'Session ID is required');
  }

  // 1. Check if Attendee is already saved in the database
  let attendee: IAttendee | null = await Attendee.findOne({ stripeSessionId: sessionId });
  if (attendee) {
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
          qrCode: attendee.qrCode,
          publicPassUrl: attendee.publicPassUrl,
        },
        'Attendee payment verified and pass confirmed'
      )
    );
    return;
  }

  // 2. Check if Vendor is already saved in the database
  let vendor: IVendor | null = await Vendor.findOne({ stripeSessionId: sessionId });
  if (vendor) {
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
        'Vendor payment verified and profile confirmed'
      )
    );
    return;
  }

  // 3. If mock session (in test mode), finalize from PendingRegistration directly
  if (sessionId.startsWith('mock_session_')) {
    if (sessionId.includes('_att_')) {
      attendee = await attendeeService.finalizeAttendeeRegistration(sessionId);
      if (attendee) {
        res.status(200).json(
          new ApiResponse(
            200,
            {
              type: 'attendee',
              refCode: attendee.refCode,
              fullName: attendee.fullName,
              ticketType: attendee.ticketType,
              paymentStatus: attendee.paymentStatus,
              qrCode: attendee.qrCode,
            },
            'Attendee pass confirmed'
          )
        );
        return;
      }
    } else if (sessionId.includes('_vnd_')) {
      vendor = await vendorService.finalizeVendorRegistration(sessionId);
      if (vendor) {
        res.status(200).json(
          new ApiResponse(
            200,
            {
              type: 'vendor',
              refCode: vendor.refCode,
              businessName: vendor.businessName,
              paymentStatus: vendor.paymentStatus,
              status: vendor.status,
              qrCode: vendor.qrCode,
            },
            'Vendor profile confirmed'
          )
        );
        return;
      }
    }
  }

  // 4. Retrieve live session from Stripe and finalize if paid
  const stripeSession = await stripeService.retrieveCheckoutSession(sessionId);
  if (stripeSession && stripeSession.payment_status === 'paid') {
    const regType = stripeSession.metadata?.type;
    const refCode = stripeSession.metadata?.refCode;
    const paymentIntentId =
      typeof stripeSession.payment_intent === 'string'
        ? stripeSession.payment_intent
        : null;
    const amountPaid = stripeSession.amount_total
      ? stripeSession.amount_total / 100
      : undefined;

    if (regType === 'attendee') {
      attendee = await attendeeService.finalizeAttendeeRegistration(
        sessionId,
        paymentIntentId,
        amountPaid,
        refCode
      );
      if (attendee) {
        res.status(200).json(
          new ApiResponse(
            200,
            {
              type: 'attendee',
              refCode: attendee.refCode,
              fullName: attendee.fullName,
              ticketType: attendee.ticketType,
              paymentStatus: attendee.paymentStatus,
              fastTrackPass: attendee.fastTrackPass,
              qrCode: attendee.qrCode,
              publicPassUrl: attendee.publicPassUrl,
            },
            'Attendee payment verified and pass confirmed'
          )
        );
        return;
      }
    } else if (regType === 'vendor') {
      vendor = await vendorService.finalizeVendorRegistration(
        sessionId,
        paymentIntentId,
        amountPaid,
        refCode
      );
      if (vendor) {
        res.status(200).json(
          new ApiResponse(
            200,
            {
              type: 'vendor',
              refCode: vendor.refCode,
              businessName: vendor.businessName,
              paymentTier: vendor.paymentTier,
              paymentStatus: vendor.paymentStatus,
              status: vendor.status,
              qrCode: vendor.qrCode,
              publicProfileUrl: vendor.publicProfileUrl,
            },
            'Vendor payment verified and profile confirmed'
          )
        );
        return;
      }
    }
  }

  throw new ApiError(404, `No completed registration found matching checkout session ${sessionId}`);
});

