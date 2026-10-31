import { Schema } from 'mongoose';

export const deviceInfoSchema = new Schema(
  {
    ip: {
      type: String,
      default: '',
      trim: true,
    },
    userAgent: {
      type: String,
      default: '',
      trim: true,
    },
    deviceType: {
      type: String,
      enum: ['mobile', 'tablet', 'desktop', 'unknown'],
      default: 'unknown',
    },
    os: {
      type: String,
      default: 'Unknown OS',
      trim: true,
    },
    browser: {
      type: String,
      default: 'Unknown Browser',
      trim: true,
    },
    capturedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

