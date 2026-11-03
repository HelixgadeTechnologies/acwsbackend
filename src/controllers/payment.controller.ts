import { Request, Response } from 'express';
import Stripe from 'stripe';
import env from '../config/env';
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

const renderSuccessHtml = (data: {
  name: string;
  refCode: string;
  tierOrTicket: string;
  pricePaid?: number;
  qrCode?: string;
  passUrl?: string;
  type: 'attendee' | 'vendor';
  websiteUrl: string;
}): string => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <title>Payment Successful • ACWS 2027</title>
  <meta name="theme-color" content="#0d0f14" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    body {
      background-color: #0d0f14;
      background-image: 
        radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.18) 0%, transparent 60%),
        radial-gradient(circle at 100% 100%, rgba(30, 34, 45, 0.45) 0%, transparent 50%);
      color: #f0f0f2;
      font-family: 'Montserrat', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
    }
    .card {
      width: 100%;
      max-width: 480px;
      background: #141720;
      border: 1px solid rgba(212, 175, 55, 0.35);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7), 0 0 40px rgba(212, 175, 55, 0.1);
      position: relative;
      text-align: center;
    }
    .card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; height: 5px;
      background: linear-gradient(90deg, #bfa15f, #e6ca65, #d4af37, #9b7c2b);
    }
    .header {
      padding: 32px 24px 20px;
      border-bottom: 1px dashed rgba(212, 175, 55, 0.22);
    }
    .success-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 16px;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.15);
      border: 2px solid #10b981;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #10b981;
      font-size: 32px;
      box-shadow: 0 0 25px rgba(16, 185, 129, 0.35);
    }
    .event-badge {
      font-size: 11px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #d4af37;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .title {
      font-family: 'Cinzel', serif;
      font-size: 26px;
      color: #ffffff;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .subtitle {
      font-size: 13px;
      color: #9ca3af;
      margin-top: 6px;
    }
    .body {
      padding: 24px;
    }
    .details-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 18px 20px;
      margin-bottom: 24px;
      text-align: left;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
      font-size: 13px;
    }
    .detail-row:last-child {
      margin-bottom: 0;
    }
    .detail-label {
      color: #9ca3af;
    }
    .detail-value {
      font-weight: 600;
      color: #ffffff;
    }
    .qr-container {
      background: #ffffff;
      padding: 16px;
      border-radius: 18px;
      display: inline-block;
      margin-bottom: 20px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
    }
    .qr-container img {
      width: 180px;
      height: 180px;
      display: block;
    }
    .btn-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .btn {
      display: inline-block;
      width: 100%;
      padding: 14px 20px;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: center;
      border: none;
    }
    .btn-primary {
      background: linear-gradient(135deg, #d4af37, #aa8214);
      color: #0b0c10;
      box-shadow: 0 6px 20px rgba(212, 175, 55, 0.35);
    }
    .btn-primary:hover {
      opacity: 0.92;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: rgba(255, 255, 255, 0.06);
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    .footer-note {
      font-size: 11px;
      color: #6b7280;
      margin-top: 18px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="success-icon">✓</div>
      <div class="event-badge">African & Caribbean Wedding Show 2027</div>
      <h1 class="title">Payment Successful!</h1>
      <p class="subtitle">Your official registration is confirmed and saved</p>
    </div>
    <div class="body">
      <div class="details-box">
        <div class="detail-row">
          <span class="detail-label">Name</span>
          <span class="detail-value">${data.name}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Reference</span>
          <span class="detail-value" style="color: #d4af37; font-family: monospace; font-size: 14px;">${data.refCode}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Registration</span>
          <span class="detail-value">${data.tierOrTicket}</span>
        </div>
        ${data.pricePaid !== undefined ? `
        <div class="detail-row">
          <span class="detail-label">Amount Paid</span>
          <span class="detail-value">£${data.pricePaid}</span>
        </div>` : ''}
        <div class="detail-row">
          <span class="detail-label">Status</span>
          <span class="detail-value" style="color: #10b981;">Confirmed & Paid</span>
        </div>
      </div>

      ${data.qrCode ? `
      <div class="qr-container">
        <img src="${data.qrCode}" alt="Admission QR Code" />
      </div>` : ''}

      <div class="btn-group">
        ${data.passUrl ? `<a href="${data.passUrl}" class="btn btn-primary" target="_blank">View Digital Pass</a>` : ''}
        <button onclick="window.print()" class="btn btn-secondary">Print / Save Pass</button>
        <a href="${data.websiteUrl}" class="btn btn-secondary">Return to ACWS Events Website</a>
      </div>

      <p class="footer-note">A confirmation copy has been securely linked to your reference code: <strong>${data.refCode}</strong></p>
    </div>
  </div>
</body>
</html>`;
};

const renderCancelledHtml = (refCode: string, websiteUrl: string): string => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Payment Cancelled • ACWS 2027</title>
  <meta name="theme-color" content="#0d0f14" />
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Montserrat:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: #0d0f14;
      color: #f0f0f2;
      font-family: 'Montserrat', sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
    }
    .card {
      width: 100%;
      max-width: 440px;
      background: #141720;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 32px 24px;
      text-align: center;
    }
    .icon {
      font-size: 40px;
      color: #f59e0b;
      margin-bottom: 16px;
    }
    h1 {
      font-family: 'Cinzel', serif;
      font-size: 24px;
      margin-bottom: 8px;
    }
    p {
      color: #9ca3af;
      font-size: 14px;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .btn {
      display: inline-block;
      width: 100%;
      padding: 12px 20px;
      border-radius: 10px;
      background: #d4af37;
      color: #000;
      text-decoration: none;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">⚠️</div>
    <h1>Payment Cancelled</h1>
    <p>Your payment session was cancelled. No charges were made. ${refCode ? `Your draft reservation code is <strong>${refCode}</strong>.` : ''}</p>
    <a href="${websiteUrl}" class="btn">Return to Website</a>
  </div>
</body>
</html>`;
};

/**
 * GET /payment/success or GET /api/v1/payments/success
 * Handles user return after Stripe Checkout payment.
 * Displays a branded responsive HTML confirmation and pass, or JSON if requested.
 */
export const handlePaymentSuccess = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const sessionId = (req.query.session_id || req.query.sessionId || req.params.sessionId) as string;
  const refCode = (req.query.refCode || req.query.ref) as string;
  const type = ((req.query.type as string) || '').toLowerCase();
  const websiteUrl = env.frontendUrl || 'http://acwsevents.com';

  let attendee: IAttendee | null = null;
  let vendor: IVendor | null = null;

  // 1. Check database by sessionId
  if (sessionId) {
    attendee = await Attendee.findOne({ stripeSessionId: sessionId });
    if (!attendee) {
      vendor = await Vendor.findOne({ stripeSessionId: sessionId });
    }
  }

  // 2. Check database by refCode
  if (!attendee && !vendor && refCode) {
    const cleanRef = refCode.toUpperCase().trim();
    attendee = await Attendee.findOne({ refCode: cleanRef });
    if (!attendee) {
      vendor = await Vendor.findOne({ refCode: cleanRef });
    }
  }

  // 3. If not yet finalized, finalize now using Stripe session
  if (!attendee && !vendor && sessionId) {
    try {
      const stripeSession = await stripeService.retrieveCheckoutSession(sessionId);
      if (stripeSession && stripeSession.payment_status === 'paid') {
        const regType = stripeSession.metadata?.type || type;
        const metaRefCode = stripeSession.metadata?.refCode || refCode;
        const paymentIntentId =
          typeof stripeSession.payment_intent === 'string'
            ? stripeSession.payment_intent
            : null;
        const amountPaid = stripeSession.amount_total
          ? stripeSession.amount_total / 100
          : undefined;

        if (regType === 'vendor') {
          vendor = await vendorService.finalizeVendorRegistration(
            sessionId,
            paymentIntentId,
            amountPaid,
            metaRefCode
          );
        } else {
          attendee = await attendeeService.finalizeAttendeeRegistration(
            sessionId,
            paymentIntentId,
            amountPaid,
            metaRefCode
          );
        }
      }
    } catch (err: any) {
      logger.warn(`Could not finalize session on success page: ${err.message}`);
    }
  }

  // 4. Return JSON if requested by API client
  if (req.xhr || req.headers.accept?.includes('application/json')) {
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
            websiteUrl,
          },
          'Attendee payment verified and pass confirmed'
        )
      );
      return;
    }

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
            websiteUrl,
          },
          'Vendor payment verified and profile confirmed'
        )
      );
      return;
    }
  }

  // 5. Render responsive HTML Success & Pass Screen
  const html = renderSuccessHtml({
    name: attendee ? attendee.fullName : vendor ? vendor.businessName : 'Valued Guest',
    refCode: attendee ? attendee.refCode : vendor ? vendor.refCode : refCode || 'ACWS-2027',
    tierOrTicket: attendee ? attendee.ticketType : vendor ? `${vendor.paymentTier} Booth` : 'ACWS 2027 Registration',
    pricePaid: attendee ? attendee.pricePaid : vendor ? vendor.pricePaid : undefined,
    qrCode: attendee?.qrCode || vendor?.qrCode,
    passUrl: attendee?.publicPassUrl || vendor?.publicProfileUrl,
    type: vendor ? 'vendor' : 'attendee',
    websiteUrl,
  });

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
});

/**
 * GET /payment/cancelled or GET /api/v1/payments/cancelled
 * Handles user return if checkout was cancelled.
 */
export const handlePaymentCancelled = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const refCode = (req.query.refCode || req.query.ref || '') as string;
  const websiteUrl = env.frontendUrl || 'http://acwsevents.com';

  if (req.xhr || req.headers.accept?.includes('application/json')) {
    res.status(200).json(
      new ApiResponse(
        200,
        {
          status: 'cancelled',
          refCode,
          websiteUrl,
        },
        'Payment checkout was cancelled'
      )
    );
    return;
  }

  const html = renderCancelledHtml(refCode, websiteUrl);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
});


