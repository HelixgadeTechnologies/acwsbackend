import mongoose from 'mongoose';
import Attendee, { generateAttendeeRefCode } from '../models/attendee.model';
import ApiError from '../utils/ApiError';
import env from '../config/env';
import { getAttendeeTicketPricing } from '../config/pricing';
import { generateQRCodeDataUrl } from './qrcode.service';
import * as stripeService from './stripe.service';
import { IDeviceInfo } from '../interfaces/device.interface';
import {
  AttendeeQueryFilters,
  CreateAttendeeInput,
  IAttendee,
  PublicAttendeeProfile,
} from '../interfaces/attendee.interface';

export interface AttendeeRegistrationResult {
  attendee: IAttendee;
  refCode: string;
  qrCode?: string;
  publicPassUrl?: string;
  checkoutUrl: string | null;
  sessionId: string | null;
}

/**
 * Builds the public ticket pass destination URL for an attendee
 */
export const buildPublicPassUrl = (refCode: string): string => {
  const base = env.publicProfileBaseUrl.replace(/\/vendors\/public\/?$/, '').replace(/\/$/, '');
  return `${base}/attendees/public/${refCode}/pass`;
};

/**
 * Register a new attendee pass, generate QR code, and initiate Stripe Checkout session if paid
 */
export const registerAttendee = async (
  data: CreateAttendeeInput
): Promise<AttendeeRegistrationResult> => {
  const pricing = getAttendeeTicketPricing(data.ticketType);
  const isFree = pricing.amountInPence <= 0;

  const refCode = data.refCode ? data.refCode.toUpperCase().trim() : generateAttendeeRefCode();
  const publicPassUrl = buildPublicPassUrl(refCode);
  const qrCode = await generateQRCodeDataUrl(publicPassUrl);

  const attendee = await Attendee.create({
    ...data,
    refCode,
    pricePaid: typeof data.pricePaid === 'number' ? data.pricePaid : pricing.priceInPounds,
    ticketPrice: data.ticketPrice || `£${pricing.priceInPounds}`,
    fastTrackPass: pricing.fastTrackPass,
    paymentStatus: isFree ? 'complimentary' : (data.paymentStatus || 'pending'),
    publicPassUrl,
    qrCode,
    registeredAt: new Date(),
  });

  let checkoutUrl: string | null = null;
  let sessionId: string | null = null;

  if (!isFree) {
    const sessionResult = await stripeService.createAttendeeCheckoutSession(attendee);
    if (sessionResult) {
      checkoutUrl = sessionResult.checkoutUrl;
      sessionId = sessionResult.sessionId;
      attendee.stripeSessionId = sessionId;
      await attendee.save();
    }
  }

  return {
    attendee,
    refCode: attendee.refCode,
    qrCode: attendee.qrCode,
    publicPassUrl: attendee.publicPassUrl,
    checkoutUrl,
    sessionId,
  };
};

/**
 * Fetch public attendee ticket pass details by refCode
 */
export const getPublicAttendeeProfile = async (
  refCode: string
): Promise<PublicAttendeeProfile> => {
  const cleanCode = refCode.toUpperCase().trim();
  let attendee = await Attendee.findOne({ refCode: cleanCode });

  if (!attendee) {
    throw new ApiError(404, `Ticket pass with reference code "${cleanCode}" was not found.`);
  }

  // Ensure QR code and pass URL are generated if missing
  if (!attendee.qrCode || !attendee.publicPassUrl) {
    attendee.publicPassUrl = buildPublicPassUrl(attendee.refCode);
    attendee.qrCode = await generateQRCodeDataUrl(attendee.publicPassUrl);
    await attendee.save();
  }

  return {
    refCode: attendee.refCode,
    fullName: attendee.fullName,
    ticketType: attendee.ticketType,
    ticketPrice: attendee.ticketPrice,
    paymentStatus: attendee.paymentStatus,
    fastTrackPass: attendee.fastTrackPass,
    checkedIn: attendee.checkedIn,
    checkedInAt: attendee.checkedInAt,
    qrCode: attendee.qrCode,
    publicPassUrl: attendee.publicPassUrl,
    registeredAt: attendee.registeredAt,
  };
};

/**
 * Render luxury mobile-first HTML Ticket Pass for attendees
 */
export const renderAttendeePassHtml = (profile: PublicAttendeeProfile): string => {
  const paymentBadgeText =
    profile.paymentStatus === 'paid'
      ? 'Payment Confirmed'
      : profile.paymentStatus === 'complimentary'
      ? 'Complimentary Pass'
      : profile.paymentStatus === 'failed'
      ? 'Payment Failed'
      : 'Payment Pending';

  const paymentBadgeClass =
    profile.paymentStatus === 'paid' || profile.paymentStatus === 'complimentary'
      ? 'badge-success'
      : profile.paymentStatus === 'failed'
      ? 'badge-failed'
      : 'badge-pending';

  const checkinBadgeText = profile.checkedIn ? 'Checked In' : 'Valid for Entry';
  const checkinBadgeClass = profile.checkedIn ? 'badge-checkedin' : 'badge-ready';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>${profile.fullName} • ACWS 2027 Admission Pass</title>
  <meta name="theme-color" content="#0d0f14" />
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-tap-highlight-color: transparent;
    }
    body {
      background-color: #0d0f14;
      background-image: 
        radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.15) 0%, transparent 60%),
        radial-gradient(circle at 100% 100%, rgba(30, 34, 45, 0.4) 0%, transparent 50%);
      color: #f0f0f2;
      font-family: 'Montserrat', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px 16px;
    }
    .pass-card {
      width: 100%;
      max-width: 440px;
      background: #141720;
      border: 1px solid rgba(212, 175, 55, 0.28);
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.65), 0 0 35px rgba(212, 175, 55, 0.08);
      position: relative;
    }
    .pass-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #bfa15f, #e6ca65, #d4af37, #9b7c2b);
    }
    .header {
      padding: 28px 24px 20px;
      text-align: center;
      border-bottom: 1px dashed rgba(212, 175, 55, 0.2);
      position: relative;
    }
    .event-badge {
      display: inline-block;
      font-size: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #d4af37;
      background: rgba(212, 175, 55, 0.12);
      border: 1px solid rgba(212, 175, 55, 0.35);
      padding: 5px 14px;
      border-radius: 999px;
      margin-bottom: 12px;
      font-weight: 700;
    }
    .event-title {
      font-family: 'Cinzel', serif;
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      letter-spacing: 0.5px;
      line-height: 1.3;
      margin-bottom: 6px;
    }
    .event-subtitle {
      font-size: 12px;
      color: #9ba0a6;
      font-weight: 500;
      letter-spacing: 0.5px;
    }
    .body {
      padding: 24px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .attendee-name {
      font-family: 'Cinzel', serif;
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      text-align: center;
      margin-bottom: 8px;
    }
    .ticket-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: #d4af37;
      background: rgba(212, 175, 55, 0.15);
      border: 1px solid rgba(212, 175, 55, 0.4);
      padding: 6px 16px;
      border-radius: 12px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .badges-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
      margin-bottom: 24px;
      width: 100%;
    }
    .status-badge {
      font-size: 11px;
      padding: 5px 12px;
      border-radius: 999px;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .badge-success {
      background: rgba(46, 204, 113, 0.12);
      border: 1px solid rgba(46, 204, 113, 0.35);
      color: #2ecc71;
    }
    .badge-pending {
      background: rgba(243, 156, 18, 0.12);
      border: 1px solid rgba(243, 156, 18, 0.35);
      color: #f39c12;
    }
    .badge-failed {
      background: rgba(231, 76, 60, 0.12);
      border: 1px solid rgba(231, 76, 60, 0.35);
      color: #e74c3c;
    }
    .badge-checkedin {
      background: rgba(52, 152, 219, 0.12);
      border: 1px solid rgba(52, 152, 219, 0.35);
      color: #3498db;
    }
    .badge-ready {
      background: rgba(155, 89, 182, 0.12);
      border: 1px solid rgba(155, 89, 182, 0.35);
      color: #9b59b6;
    }
    .badge-fasttrack {
      background: rgba(212, 175, 55, 0.18);
      border: 1px solid rgba(212, 175, 55, 0.5);
      color: #e6ca65;
    }
    .qr-container {
      background: #ffffff;
      padding: 16px;
      border-radius: 18px;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
      margin-bottom: 20px;
      border: 2px solid #d4af37;
    }
    .qr-image {
      width: 190px;
      height: 190px;
      display: block;
    }
    .ref-code {
      font-family: monospace;
      font-size: 13px;
      letter-spacing: 2px;
      color: #141720;
      font-weight: 700;
      margin-top: 8px;
    }
    .pass-details {
      width: 100%;
      background: #10121a;
      border: 1px solid #232734;
      border-radius: 14px;
      padding: 14px 18px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .detail-item {
      display: flex;
      flex-direction: column;
    }
    .detail-label {
      font-size: 10px;
      color: #7b8089;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    .detail-val {
      font-size: 13px;
      color: #ffffff;
      font-weight: 600;
    }
    .footer {
      background: #0d0f14;
      padding: 14px 20px;
      border-top: 1px solid #1f232e;
      text-align: center;
      font-size: 11px;
      color: #7a7f87;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="pass-card">
    <div class="header">
      <div class="event-badge">Official Admission Pass</div>
      <div class="event-title">African & Caribbean Wedding Show</div>
      <div class="event-subtitle">London • 2027 • ExCeL London</div>
    </div>

    <div class="body">
      <div class="attendee-name">${profile.fullName}</div>
      <div class="ticket-badge">🎟 ${profile.ticketType}</div>

      <div class="badges-row">
        <span class="status-badge ${paymentBadgeClass}">● ${paymentBadgeText}</span>
        <span class="status-badge ${checkinBadgeClass}">● ${checkinBadgeText}</span>
        ${profile.fastTrackPass ? '<span class="status-badge badge-fasttrack">⚡ Fast Track Access</span>' : ''}
      </div>

      ${
        profile.qrCode
          ? `<div class="qr-container">
               <img src="${profile.qrCode}" alt="Ticket QR Code" class="qr-image" />
               <div class="ref-code">${profile.refCode}</div>
             </div>`
          : ''
      }

      <div class="pass-details">
        <div class="detail-item">
          <span class="detail-label">Pass Reference</span>
          <span class="detail-val">${profile.refCode}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Ticket Tier</span>
          <span class="detail-val">${profile.ticketType}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Price / Paid</span>
          <span class="detail-val">${profile.ticketPrice}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Entry Lane</span>
          <span class="detail-val">${profile.fastTrackPass ? 'VIP / Fast Track' : 'General Lane'}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      Present this digital pass at the entrance • ACWS 2027
    </div>
  </div>
</body>
</html>`;
};

/**
 * Fetch paginated list of attendees with search and filtering for Admin
 */
export const getAdminAttendees = async (
  query: AttendeeQueryFilters
): Promise<{ attendees: IAttendee[]; total: number; page: number; totalPages: number }> => {
  const page = Number(query.page) || 1;
  const limit = Math.min(Number(query.limit) || 20, 100);
  const skip = (page - 1) * limit;
  const sortBy = query.sortBy || '-registeredAt';

  const filter: Record<string, any> = {};

  if (query.ticketType) {
    filter.ticketType = query.ticketType;
  }

  if (query.attendeeType) {
    filter.attendeeType = query.attendeeType;
  }

  if (query.checkedIn !== undefined && query.checkedIn !== '') {
    filter.checkedIn = query.checkedIn === true || query.checkedIn === 'true';
  }

  if (query.search && query.search.trim() !== '') {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    filter.$or = [
      { fullName: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { refCode: searchRegex },
      { attendeeType: searchRegex },
      { weddingLocation: searchRegex },
    ];
  }

  const [attendees, total] = await Promise.all([
    Attendee.find(filter).sort(sortBy).skip(skip).limit(limit),
    Attendee.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(total / limit) || 1;

  return {
    attendees,
    total,
    page,
    totalPages,
  };
};

/**
 * Toggle or explicitly set attendee check-in status by MongoDB _id OR refCode
 */
export const checkinAttendee = async (
  idOrRef: string,
  explicitStatus?: boolean,
  checkInDevice?: IDeviceInfo
): Promise<IAttendee> => {
  const clean = idOrRef.trim();
  let attendee: IAttendee | null = null;

  if (mongoose.isValidObjectId(clean)) {
    attendee = await Attendee.findById(clean);
  }

  if (!attendee) {
    attendee = await Attendee.findOne({ refCode: clean.toUpperCase() });
  }

  if (!attendee) {
    throw new ApiError(404, `Attendee with identifier "${clean}" not found`);
  }

  if (explicitStatus !== undefined) {
    attendee.checkedIn = Boolean(explicitStatus);
  } else {
    attendee.checkedIn = !attendee.checkedIn;
  }

  attendee.checkedInAt = attendee.checkedIn ? new Date() : null;
  if (attendee.checkedIn && checkInDevice) {
    attendee.checkInDevice = checkInDevice;
  } else if (!attendee.checkedIn) {
    attendee.checkInDevice = null;
  }
  await attendee.save();

  return attendee;
};

/**
 * Batch import attendees (e.g. from CSV / Eventbrite / external ticket system)
 */
export const batchImportAttendees = async (
  attendees: CreateAttendeeInput[]
): Promise<{ count: number }> => {
  if (!Array.isArray(attendees) || attendees.length === 0) {
    throw new ApiError(400, 'Attendees array must contain at least one attendee');
  }

  const docs = attendees.map((item) => ({
    ...item,
    refCode: item.refCode ? item.refCode.toUpperCase().trim() : generateAttendeeRefCode(),
    fullName: item.fullName || 'Anonymous Guest',
    email: item.email ? item.email.toLowerCase().trim() : '',
    ticketType: item.ticketType || 'General Admission',
    paymentStatus: item.paymentStatus || 'paid',
    pricePaid: typeof item.pricePaid === 'number' ? item.pricePaid : 20,
    fastTrackPass: Boolean(item.fastTrackPass),
    checkedIn: Boolean(item.checkedIn),
    registeredAt: new Date(),
  }));

  const inserted = await Attendee.insertMany(docs);

  return {
    count: inserted.length,
  };
};
