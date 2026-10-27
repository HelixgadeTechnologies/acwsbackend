import mongoose, { Schema, Model } from 'mongoose';
import { IVendor } from '../interfaces/vendor.interface';

export const generateRefCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomCode = '';
  for (let i = 0; i < 5; i++) {
    randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ACWS-2027-VND-${randomCode}`;
};

const vendorSchema = new Schema<IVendor>(
  {
    refCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
      default: generateRefCode,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'waitlisted'],
      default: 'pending',
      index: true,
    },
    businessName: {
      type: String,
      required: [true, 'Business name is required'],
      trim: true,
      index: true,
    },
    contactPerson: {
      type: String,
      trim: true,
      default: '',
    },
    contactName: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    instagram: {
      type: String,
      trim: true,
      default: '',
    },
    website: {
      type: String,
      trim: true,
      default: 'N/A',
    },
    baseLocation: {
      type: String,
      trim: true,
      default: '',
    },
    serviceAreas: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    marketsServed: {
      type: [String],
      default: [],
    },
    weddingVolume: {
      type: String,
      trim: true,
      default: 'Not specified',
    },
    typicalSpend: {
      type: String,
      trim: true,
      default: 'Not specified',
    },
    objectives: {
      type: [String],
      default: [],
    },
    discoveryChannels: {
      type: [String],
      default: [],
    },
    paymentTier: {
      type: String,
      enum: ['standard', 'premium', 'catwalk', 'executive'],
      default: 'standard',
      index: true,
    },
    privacyAcknowledged: {
      type: Boolean,
      default: true,
    },
    marketingConsent: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    curatorNotes: {
      type: String,
      default: '',
      trim: true,
    },
    qrCode: {
      type: String,
      default: '',
    },
    publicProfileUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook: ensure refCode is set and harmonize contactPerson / contactName
vendorSchema.pre<IVendor>('save', function (next) {
  if (!this.refCode) {
    this.refCode = generateRefCode();
  }
  if (!this.contactPerson && this.contactName) {
    this.contactPerson = this.contactName;
  }
  if (!this.contactName && this.contactPerson) {
    this.contactName = this.contactPerson;
  }
  next();
});

const Vendor: Model<IVendor> = mongoose.model<IVendor>('Vendor', vendorSchema);

export default Vendor;
