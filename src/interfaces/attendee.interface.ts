import { Document, Types } from 'mongoose';

export type TicketType = 'standard' | 'vip' | 'catwalk-exclusive';
export type PaymentStatus = 'paid' | 'pending' | 'complimentary';

export interface IAttendee extends Document {
  _id: Types.ObjectId;
  refCode: string;
  fullName: string;
  partnerName?: string;
  email: string;
  phone?: string;
  ticketType: TicketType;
  pricePaid: number;
  paymentStatus: PaymentStatus;
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
  partnerName?: string;
  email: string;
  phone?: string;
  ticketType?: TicketType;
  pricePaid?: number;
  paymentStatus?: PaymentStatus;
  weddingDate?: string;
  fastTrackPass?: boolean;
  checkedIn?: boolean;
}

export interface AttendeeQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  ticketType?: TicketType;
  checkedIn?: string | boolean;
  sortBy?: string;
}
