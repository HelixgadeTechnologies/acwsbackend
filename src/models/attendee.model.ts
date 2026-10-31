import mongoose, { Schema, Model } from 'mongoose';
import { IAttendee } from '../interfaces/attendee.interface';
import { deviceInfoSchema } from './deviceInfo.schema';

export const generateAttendeeRefCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomCode = '';
  for (let i = 0; i < 4; i++) {
    randomCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `ACWS-2027-ATT-${randomCode}`;
};

const attendeeSchema = new Schema<IAttendee>(
  {
    refCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
      default: generateAttendeeRefCode,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      index: true,
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
    attendeeType: {
      type: String,
      trim: true,
      default: 'Bride',
      index: true,
    },
    weddingTimeframe: {
      type: String,
      trim: true,
      default: '',
    },
    weddingLocation: {
      type: String,
      trim: true,
      default: '',
    },
    weddingBudget: {
      type: String,
      trim: true,
      default: 'Not specified',
    },
    guestCount: {
      type: String,
      trim: true,
      default: 'Not specified',
    },
    servicesNeeded: {
      type: [String],
      default: [],
    },
    culturalInfluences: {
      type: [String],
      default: [],
    },
    discoveryChannel: {
      type: String,
      trim: true,
      default: 'Instagram',
    },
    ticketType: {
      type: String,
      default: 'General Admission',
      index: true,
    },
    ticketPrice: {
      type: String,
      default: '£20',
    },
    pricePaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending', 'failed', 'complimentary'],
      default: 'pending',
      index: true,
    },
    stripeSessionId: {
      type: String,
      trim: true,
      index: true,
      default: null,
    },
    stripePaymentIntentId: {
      type: String,
      trim: true,
      default: null,
    },
    paidAt: {
      type: Date,
      default: null,
    },
    privacyAcknowledged: {
      type: Boolean,
      default: true,
    },
    marketingConsent: {
      type: Boolean,
      default: false,
    },
    partnerConsent: {
      type: Boolean,
      default: false,
    },
    partnerName: {
      type: String,
      trim: true,
      default: '',
    },
    weddingDate: {
      type: String,
      trim: true,
      default: '',
    },
    fastTrackPass: {
      type: Boolean,
      default: false,
    },
    checkedIn: {
      type: Boolean,
      default: false,
      index: true,
    },
    checkedInAt: {
      type: Date,
      default: null,
    },
    qrCode: {
      type: String,
      default: '',
    },
    publicPassUrl: {
      type: String,
      default: '',
    },
    registrationDevice: {
      type: deviceInfoSchema,
      default: null,
    },
    checkInDevice: {
      type: deviceInfoSchema,
      default: null,
    },
    lastScannedDevice: {
      type: deviceInfoSchema,
      default: null,
    },
    scanCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    registeredAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for search
attendeeSchema.index({
  fullName: 'text',
  email: 'text',
  refCode: 'text',
  phone: 'text',
});

// Fallback pre-save hook
attendeeSchema.pre<IAttendee>('save', function (next) {
  if (!this.refCode) {
    this.refCode = generateAttendeeRefCode();
  }
  next();
});

const Attendee: Model<IAttendee> = mongoose.model<IAttendee>('Attendee', attendeeSchema);

export default Attendee;
