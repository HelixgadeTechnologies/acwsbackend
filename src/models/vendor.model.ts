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
      required: [true, 'Contact person is required'],
      trim: true,
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
      required: [true, 'Phone number is required'],
      trim: true,
    },
    instagram: {
      type: String,
      required: [true, 'Instagram handle is required'],
      trim: true,
    },
    website: {
      type: String,
      trim: true,
      default: 'N/A',
    },
    baseLocation: {
      type: String,
      required: [true, 'Base location is required'],
      trim: true,
    },
    serviceAreas: {
      type: [String],
      required: [true, 'At least one service area is required'],
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: 'At least one service area must be specified',
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    marketsServed: {
      type: [String],
      required: [true, 'At least one market served is required'],
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length > 0,
        message: 'At least one market served must be specified',
      },
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
      required: [true, 'Objectives are required (1 to 3 items)'],
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length >= 1 && v.length <= 3,
        message: 'Objectives must contain between 1 and 3 items',
      },
    },
    discoveryChannels: {
      type: [String],
      required: [true, 'Discovery channels are required (1 to 3 items)'],
      validate: {
        validator: (v: string[]) => Array.isArray(v) && v.length >= 1 && v.length <= 3,
        message: 'Discovery channels must contain between 1 and 3 items',
      },
    },
    paymentTier: {
      type: String,
      required: [true, 'Payment tier is required'],
      enum: ['standard', 'premium', 'catwalk'],
      index: true,
    },
    privacyAcknowledged: {
      type: Boolean,
      required: [true, 'Privacy acknowledgement is required'],
    },
    marketingConsent: {
      type: Boolean,
      default: false,
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

// Fallback pre-save hook to ensure refCode is set
vendorSchema.pre<IVendor>('save', function (next) {
  if (!this.refCode) {
    this.refCode = generateRefCode();
  }
  next();
});

const Vendor: Model<IVendor> = mongoose.model<IVendor>('Vendor', vendorSchema);

export default Vendor;
