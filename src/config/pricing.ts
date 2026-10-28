import { PaymentTier } from '../interfaces/vendor.interface';

export interface TicketPricingResult {
  priceInPounds: number;
  amountInPence: number;
  fastTrackPass: boolean;
  ticketLabel: string;
}

export interface VendorPricingResult {
  priceInPounds: number;
  amountInPence: number;
  tierLabel: string;
}

/**
 * Calculates attendee ticket price and benefits based on ticketType
 */
export const getAttendeeTicketPricing = (ticketType: string = ''): TicketPricingResult => {
  const normalized = ticketType.toLowerCase().trim();

  if (normalized.includes('vip')) {
    return {
      priceInPounds: 40,
      amountInPence: 4000,
      fastTrackPass: true,
      ticketLabel: 'VIP Pass (Includes Fast Track)',
    };
  }

  if (normalized.includes('couple')) {
    return {
      priceInPounds: 35,
      amountInPence: 3500,
      fastTrackPass: false,
      ticketLabel: 'Couple Pass',
    };
  }

  if (normalized.includes('comp') || normalized.includes('free') || normalized.includes('guest')) {
    return {
      priceInPounds: 0,
      amountInPence: 0,
      fastTrackPass: false,
      ticketLabel: 'Complimentary Pass',
    };
  }

  // Default to General Admission
  return {
    priceInPounds: 20,
    amountInPence: 2000,
    fastTrackPass: false,
    ticketLabel: 'General Admission',
  };
};

/**
 * Calculates vendor exhibition package pricing based on tier
 */
export const VENDOR_TIER_PRICING: Record<PaymentTier, { priceInPounds: number; label: string }> = {
  standard: {
    priceInPounds: 250,
    label: 'Standard Exhibitor Stand',
  },
  premium: {
    priceInPounds: 450,
    label: 'Premium Exhibitor Stand',
  },
  catwalk: {
    priceInPounds: 650,
    label: 'Catwalk Feature Stand',
  },
  executive: {
    priceInPounds: 950,
    label: 'Executive Feature Stand & Sponsorship',
  },
};

export const getVendorTierPricing = (tier: PaymentTier = 'standard'): VendorPricingResult => {
  const config = VENDOR_TIER_PRICING[tier] || VENDOR_TIER_PRICING.standard;
  return {
    priceInPounds: config.priceInPounds,
    amountInPence: config.priceInPounds * 100,
    tierLabel: config.label,
  };
};

