import { Document, Types } from 'mongoose';

export type PaymentStatus = 'paid' | 'pending' | 'complimentary';

export interface IAttendee extends Document {
  _id: Types.ObjectId;
  refCode: string;
  fullName: string;
  email: string;
  phone?: string;
  attendeeType: string;
  weddingTimeframe?: string;
  weddingLocation?: string;
  weddingBudget?: string;
  guestCount?: string;
  servicesNeeded: string[];
  culturalInfluences: string[];
  discoveryChannel: string;
  ticketType: string;
  ticketPrice: string;
  pricePaid: number;
  paymentStatus: PaymentStatus;
  privacyAcknowledged: boolean;
  marketingConsent: boolean;
  partnerConsent: boolean;
  partnerName?: string;
  weddingDate?: string;
  fastTrackPass: boolean;
  checkedIn: boolean;
  checkedInAt?: Date | null;
  registeredAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAttendeeInput {
  refCode?: string;
  fullName: string;
  email: string;
  phone?: string;
  attendeeType?: string;
  weddingTimeframe?: string;
  weddingLocation?: string;
  weddingBudget?: string;
  guestCount?: string;
  servicesNeeded?: string[];
  culturalInfluences?: string[];
  discoveryChannel?: string;
  ticketType?: string;
  ticketPrice?: string;
  pricePaid?: number;
  paymentStatus?: PaymentStatus;
  privacyAcknowledged?: boolean;
  marketingConsent?: boolean;
  partnerConsent?: boolean;
  partnerName?: string;
  weddingDate?: string;
  fastTrackPass?: boolean;
  checkedIn?: boolean;
}

export interface AttendeeQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  ticketType?: string;
  attendeeType?: string;
  checkedIn?: string | boolean;
  sortBy?: string;
}
