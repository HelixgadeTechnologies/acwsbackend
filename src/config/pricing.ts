import { PaymentTier } from '../interfaces/vendor.interface';

export interface TicketPricingResult {
  key: string;
  priceInPounds: number;
  amountInPence: number;
  fastTrackPass: boolean;
  ticketLabel: string;
}

export interface VendorPricingResult {
  key: string;
  tier: PaymentTier;
  priceInPounds: number;
  amountInPence: number;
  tierLabel: string;
}

export const ATTENDEE_TICKETS = {
  general: {
    key: 'general',
    priceInPounds: 20,
    amountInPence: 2000,
    fastTrackPass: false,
    ticketLabel: 'General Admission',
  },
  couple: {
    key: 'couple',
    priceInPounds: 35,
    amountInPence: 3500,
    fastTrackPass: false,
    ticketLabel: 'Couple Pass',
  },
  vip: {
    key: 'vip',
    priceInPounds: 40,
    amountInPence: 4000,
    fastTrackPass: true,
    ticketLabel: 'VIP Royal Experience',
  },
  complimentary: {
    key: 'complimentary',
    priceInPounds: 0,
    amountInPence: 0,
    fastTrackPass: false,
    ticketLabel: 'Complimentary Pass',
  },
};

/**
 * Calculates attendee ticket price and benefits based on ticketType
 */
export const getAttendeeTicketPricing = (ticketType: string = ''): TicketPricingResult => {
  const normalized = ticketType.toLowerCase().trim();

  if (normalized.includes('vip')) {
    return {
      ...ATTENDEE_TICKETS.vip,
    };
  }

  if (normalized.includes('couple')) {
    return {
      ...ATTENDEE_TICKETS.couple,
    };
  }

  if (normalized.includes('comp') || normalized.includes('free') || normalized.includes('guest')) {
    return {
      ...ATTENDEE_TICKETS.complimentary,
    };
  }

  // Default to General Admission
  return {
    ...ATTENDEE_TICKETS.general,
  };
};

/**
 * Calculates vendor exhibition package pricing based on tier
 */
export const VENDOR_TIER_PRICING: Record<PaymentTier, { priceInPounds: number; label: string }> = {
  catwalk: {
    priceInPounds: 500,
    label: 'Runway Package (Catwalk Only)',
  },
  standard: {
    priceInPounds: 650,
    label: 'Essential Exhibitor Package',
  },
  premium: {
    priceInPounds: 1050,
    label: 'Signature Package (Exhibition Space + Catwalk)',
  },
  executive: {
    priceInPounds: 1500,
    label: 'Executive Feature Stand & Sponsorship',
  },
};

const VENDOR_ALIAS_MAP: Record<string, PaymentTier> = {
  runway: 'catwalk',
  catwalk: 'catwalk',
  essential: 'standard',
  standard: 'standard',
  signature: 'premium',
  premium: 'premium',
  executive: 'executive',
};

export const getVendorTierPricing = (tierInput: string = 'standard'): VendorPricingResult => {
  const normalized = (tierInput || '').toLowerCase().trim();
  const matchedTier = VENDOR_ALIAS_MAP[normalized] || 'standard';
  const config = VENDOR_TIER_PRICING[matchedTier] || VENDOR_TIER_PRICING.standard;

  return {
    key: normalized,
    tier: matchedTier,
    priceInPounds: config.priceInPounds,
    amountInPence: config.priceInPounds * 100,
    tierLabel: config.label,
  };
};

export const getPublicPricing = () => {
  return {
    attendee: {
      general: {
        key: 'general',
        label: ATTENDEE_TICKETS.general.ticketLabel,
        priceInPounds: ATTENDEE_TICKETS.general.priceInPounds,
        amountInPence: ATTENDEE_TICKETS.general.amountInPence,
        fastTrackPass: ATTENDEE_TICKETS.general.fastTrackPass,
      },
      couple: {
        key: 'couple',
        label: ATTENDEE_TICKETS.couple.ticketLabel,
        priceInPounds: ATTENDEE_TICKETS.couple.priceInPounds,
        amountInPence: ATTENDEE_TICKETS.couple.amountInPence,
        fastTrackPass: ATTENDEE_TICKETS.couple.fastTrackPass,
      },
      vip: {
        key: 'vip',
        label: ATTENDEE_TICKETS.vip.ticketLabel,
        priceInPounds: ATTENDEE_TICKETS.vip.priceInPounds,
        amountInPence: ATTENDEE_TICKETS.vip.amountInPence,
        fastTrackPass: ATTENDEE_TICKETS.vip.fastTrackPass,
      },
    },
    vendor: {
      runway: {
        key: 'runway',
        tier: 'catwalk',
        label: 'Runway Package',
        priceInPounds: 500,
        amountInPence: 50000,
      },
      essential: {
        key: 'essential',
        tier: 'standard',
        label: 'Essential Exhibitor Package',
        priceInPounds: 650,
        amountInPence: 65000,
      },
      signature: {
        key: 'signature',
        tier: 'premium',
        label: 'Signature Package',
        priceInPounds: 1050,
        amountInPence: 105000,
      },
    },
  };
};
