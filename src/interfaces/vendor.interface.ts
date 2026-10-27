import { Document, Types } from 'mongoose';

export type VendorStatus = 'pending' | 'approved' | 'rejected' | 'waitlisted';
export type PaymentTier = 'standard' | 'premium' | 'catwalk' | 'executive';

export interface IVendor extends Document {
  _id: Types.ObjectId;
  refCode: string;
  status: VendorStatus;
  businessName: string;
  contactPerson: string;
  contactName?: string;
  email: string;
  phone: string;
  instagram: string;
  website: string;
  baseLocation: string;
  serviceAreas: string[];
  category: string;
  marketsServed: string[];
  weddingVolume: string;
  typicalSpend: string;
  objectives: string[];
  discoveryChannels: string[];
  paymentTier: PaymentTier;
  privacyAcknowledged: boolean;
  marketingConsent: boolean;
  notes?: string;
  curatorNotes?: string;
  qrCode?: string;
  publicProfileUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicVendorProfile {
  refCode: string;
  businessName: string;
  website: string;
  instagram: string;
  phone: string;
  email: string;
  category: string;
  baseLocation: string;
  qrCode?: string;
  publicProfileUrl?: string;
}

export interface CreateVendorInput {
  refCode?: string;
  businessName: string;
  contactPerson?: string;
  contactName?: string;
  email: string;
  phone?: string;
  instagram?: string;
  website?: string;
  baseLocation?: string;
  serviceAreas?: string[];
  category: string;
  marketsServed?: string[];
  weddingVolume?: string;
  typicalSpend?: string;
  objectives?: string[];
  discoveryChannels?: string[];
  paymentTier?: PaymentTier;
  privacyAcknowledged?: boolean;
  marketingConsent?: boolean;
  notes?: string;
  curatorNotes?: string;
}

export interface VendorQueryFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: VendorStatus;
  category?: string;
  paymentTier?: PaymentTier;
  sortBy?: string;
}

export interface VendorStatsResult {
  total: number;
  approved: number;
  pending: number;
  waitlisted: number;
  rejected: number;
  catwalk: number;
  premium: number;
  standard: number;
  executive?: number;
}
