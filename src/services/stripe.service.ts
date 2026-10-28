import Stripe from 'stripe';
import env from '../config/env';
import ApiError from '../utils/ApiError';
import { IAttendee } from '../interfaces/attendee.interface';
import { IVendor } from '../interfaces/vendor.interface';
import { getAttendeeTicketPricing, getVendorTierPricing } from '../config/pricing';

export const stripe = new Stripe(env.stripeSecretKey || 'sk_test_placeholder');

export interface CheckoutSessionResult {
  sessionId: string;
  checkoutUrl: string | null;
}

const isPlaceholderKey =
  !env.stripeSecretKey || env.stripeSecretKey.includes('placeholder');

/**
 * Creates a Stripe Checkout Session for Attendee ticket purchase
 */
export const createAttendeeCheckoutSession = async (
  attendee: IAttendee
): Promise<CheckoutSessionResult | null> => {
  const pricing = getAttendeeTicketPricing(attendee.ticketType);

  // If ticket is free / complimentary, no Stripe session needed
  if (pricing.amountInPence <= 0) {
    return null;
  }

  if (isPlaceholderKey) {
    // In local development without a configured Stripe key, log warning
    return {
      sessionId: `mock_session_att_${attendee.refCode}`,
      checkoutUrl: `${env.frontendUrl}/payment/success?session_id=mock_session_att_${attendee.refCode}&refCode=${attendee.refCode}&type=attendee`,
    };
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: attendee.email,
    client_reference_id: attendee._id.toString(),
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
      attendeeId: attendee._id.toString(),
      refCode: attendee.refCode,
      ticketType: attendee.ticketType,
    },
    success_url: `${env.frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&refCode=${attendee.refCode}&type=attendee`,
    cancel_url: `${env.frontendUrl}/payment/cancelled?refCode=${attendee.refCode}&type=attendee`,
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
  vendor: IVendor
): Promise<CheckoutSessionResult | null> => {
  const pricing = getVendorTierPricing(vendor.paymentTier);

  if (pricing.amountInPence <= 0) {
    return null;
  }

  if (isPlaceholderKey) {
    // In local development without a configured Stripe key, return a mock URL
    return {
      sessionId: `mock_session_vnd_${vendor.refCode}`,
      checkoutUrl: `${env.frontendUrl}/payment/success?session_id=mock_session_vnd_${vendor.refCode}&refCode=${vendor.refCode}&type=vendor`,
    };
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: vendor.email,
    client_reference_id: vendor._id.toString(),
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
      vendorId: vendor._id.toString(),
      refCode: vendor.refCode,
      paymentTier: vendor.paymentTier,
    },
    success_url: `${env.frontendUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}&refCode=${vendor.refCode}&type=vendor`,
    cancel_url: `${env.frontendUrl}/payment/cancelled?refCode=${vendor.refCode}&type=vendor`,
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
