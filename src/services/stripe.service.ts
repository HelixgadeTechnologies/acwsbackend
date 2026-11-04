import Stripe from 'stripe';
import env from '../config/env';
import ApiError from '../utils/ApiError';
import { IAttendee } from '../interfaces/attendee.interface';
import { IVendor, PaymentTier } from '../interfaces/vendor.interface';
import { getAttendeeTicketPricing, getVendorTierPricing } from '../config/pricing';

let stripeInstance: Stripe | null = null;
let lastApiKey = '';

export const getStripe = (): Stripe => {
  const key = env.stripeSecretKey || 'sk_test_placeholder';
  if (!stripeInstance || lastApiKey !== key) {
    stripeInstance = new Stripe(key);
    lastApiKey = key;
  }
  return stripeInstance;
};

export const stripe = new Proxy({} as Stripe, {
  get: (_target, prop: keyof Stripe) => {
    return (getStripe() as any)[prop];
  },
});

export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string | null;
}

export interface AttendeeCheckoutInput {
  email: string;
  fullName: string;
  refCode: string;
  ticketType: string;
  clientPriceInPence?: number;
  pendingId?: string;
  _id?: any;
  frontendUrl?: string;
}

export interface VendorCheckoutInput {
  email: string;
  businessName: string;
  refCode: string;
  paymentTier: PaymentTier;
  clientPriceInPence?: number;
  pendingId?: string;
  _id?: any;
  frontendUrl?: string;
}

const isPlaceholderKey = () =>
  !env.stripeSecretKey || env.stripeSecretKey.includes('placeholder');

/**
 * Creates a Stripe Checkout Session for Attendee ticket purchase
 */
export const createAttendeeCheckoutSession = async (
  attendee: AttendeeCheckoutInput | IAttendee
): Promise<CheckoutSessionResult | null> => {
  const pricing = getAttendeeTicketPricing(attendee.ticketType);

  const clientPriceAtt = (attendee as any).clientPriceInPence;
  if (typeof clientPriceAtt === 'number' && clientPriceAtt > 0 && clientPriceAtt !== pricing.amountInPence) {
    console.warn(
      `[Stripe Price Guard] Price mismatch for attendee ${attendee.refCode} (${attendee.ticketType}): frontend sent ${clientPriceAtt}p, authoritative backend price is ${pricing.amountInPence}p.`
    );
  }

  // If ticket is free / complimentary, no Stripe session needed
  if (pricing.amountInPence <= 0) {
    return null;
  }

  const targetFrontend =
    (attendee as any).frontendUrl || env.frontendUrl || 'http://acwsevents.com';

  if (isPlaceholderKey()) {
    if (process.env.NODE_ENV === 'test' || process.env.ALLOW_MOCK_PAYMENTS === 'true') {
      return {
        sessionId: `mock_session_att_${attendee.refCode}`,
        checkoutUrl: `${targetFrontend}/payment/success?session_id=mock_session_att_${attendee.refCode}&refCode=${attendee.refCode}&type=attendee`,
      };
    }
    throw new ApiError(
      500,
      'Stripe Secret Key is missing or set to placeholder in server memory. Please restart your backend server to load the updated .env file.'
    );
  }

  const clientId = (attendee as any).pendingId || (attendee as any)._id?.toString() || attendee.refCode;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: attendee.email,
    client_reference_id: clientId,
    line_items: [
      {
        price_data: {
          currency: env.stripeCurrency,
          unit_amount: pricing.amountInPence,
          product_data: {
            name: `ACWS 2027 - ${pricing.ticketLabel}`,
            description: `Admission ticket for ${attendee.fullName} (Ref: ${attendee.refCode})`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'attendee',
      attendeeId: clientId,
      refCode: attendee.refCode,
      ticketType: attendee.ticketType,
    },
    success_url: `${targetFrontend}/payment/success?session_id={CHECKOUT_SESSION_ID}&refCode=${attendee.refCode}&type=attendee`,
    cancel_url: `${targetFrontend}/payment/cancelled?refCode=${attendee.refCode}&type=attendee`,
  });

  return {
    sessionId: session.id,
    checkoutUrl: session.url,
  };
};

/**
 * Creates a Stripe Checkout Session for Vendor exhibition tier
 */
export const createVendorCheckoutSession = async (
  vendor: VendorCheckoutInput | IVendor
): Promise<CheckoutSessionResult | null> => {
  const pricing = getVendorTierPricing(vendor.paymentTier);

  const clientPriceVnd = (vendor as any).clientPriceInPence;
  if (typeof clientPriceVnd === 'number' && clientPriceVnd > 0 && clientPriceVnd !== pricing.amountInPence) {
    console.warn(
      `[Stripe Price Guard] Price mismatch for vendor ${vendor.refCode} (${vendor.paymentTier}): frontend sent ${clientPriceVnd}p, authoritative backend price is ${pricing.amountInPence}p.`
    );
  }

  if (pricing.amountInPence <= 0) {
    return null;
  }

  const targetFrontend =
    (vendor as any).frontendUrl || env.frontendUrl || 'http://acwsevents.com';

  if (isPlaceholderKey()) {
    if (process.env.NODE_ENV === 'test' || process.env.ALLOW_MOCK_PAYMENTS === 'true') {
      return {
        sessionId: `mock_session_vnd_${vendor.refCode}`,
        checkoutUrl: `${targetFrontend}/payment/success?session_id=mock_session_vnd_${vendor.refCode}&refCode=${vendor.refCode}&type=vendor`,
      };
    }
    throw new ApiError(
      500,
      'Stripe Secret Key is missing or set to placeholder in server memory. Please restart your backend server to load the updated .env file.'
    );
  }

  const clientId = (vendor as any).pendingId || (vendor as any)._id?.toString() || vendor.refCode;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: vendor.email,
    client_reference_id: clientId,
    line_items: [
      {
        price_data: {
          currency: env.stripeCurrency,
          unit_amount: pricing.amountInPence,
          product_data: {
            name: `ACWS 2027 - ${pricing.tierLabel}`,
            description: `Exhibition Stand Registration for ${vendor.businessName} (Ref: ${vendor.refCode})`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      type: 'vendor',
      vendorId: clientId,
      refCode: vendor.refCode,
      paymentTier: vendor.paymentTier,
    },
    success_url: `${targetFrontend}/payment/success?session_id={CHECKOUT_SESSION_ID}&refCode=${vendor.refCode}&type=vendor`,
    cancel_url: `${targetFrontend}/payment/cancelled?refCode=${vendor.refCode}&type=vendor`,
  });

  return {
    sessionId: session.id,
    checkoutUrl: session.url,
  };
};

/**
 * Validates and constructs Stripe webhook events using signature and raw request buffer
 */
export const constructWebhookEvent = (
  rawBody: Buffer | string,
  signature: string | string[] | undefined
): Stripe.Event => {
  if (!signature || typeof signature !== 'string') {
    throw new ApiError(400, 'Missing Stripe-Signature header');
  }

  if (!env.stripeWebhookSecret) {
    throw new ApiError(500, 'Stripe webhook secret is not configured on the server');
  }

  try {
    return stripe.webhooks.constructEvent(rawBody, signature, env.stripeWebhookSecret);
  } catch (err: any) {
    throw new ApiError(400, `Stripe webhook signature verification failed: ${err.message}`);
  }
};

/**
 * Retrieves a checkout session from Stripe
 */
export const retrieveCheckoutSession = async (
  sessionId: string
): Promise<Stripe.Checkout.Session | null> => {
  if (sessionId.startsWith('mock_session_')) {
    return null;
  }
  return stripe.checkout.sessions.retrieve(sessionId);
};
