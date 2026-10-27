import mongoose, { Schema, Model } from 'mongoose';
import { IAttendee } from '../interfaces/attendee.interface';

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
    partnerName: {
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
    ticketType: {
      type: String,
      enum: ['standard', 'vip', 'catwalk-exclusive'],
      default: 'standard',
      index: true,
    },
    pricePaid: {
      type: Number,
      default: 0,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending', 'complimentary'],
      default: 'paid',
      index: true,
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

// Fallback pre-save hook
attendeeSchema.pre<IAttendee>('save', function (next) {
  if (!this.refCode) {
    this.refCode = generateAttendeeRefCode();
  }
  next();
});

const Attendee: Model<IAttendee> = mongoose.model<IAttendee>('Attendee', attendeeSchema);

export default Attendee;
