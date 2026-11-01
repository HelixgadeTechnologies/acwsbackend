import mongoose, { Schema, Model } from 'mongoose';
import { IPendingRegistration } from '../interfaces/pendingRegistration.interface';
import { deviceInfoSchema } from './deviceInfo.schema';

const pendingRegistrationSchema = new Schema<IPendingRegistration>(
  {
    sessionId: {
      type: String,
      trim: true,
      index: true,
      default: '',
    },
    refCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['attendee', 'vendor'],
      required: true,
      index: true,
    },
    data: {
      type: Schema.Types.Mixed,
      required: true,
    },
    deviceInfo: {
      type: deviceInfoSchema,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL index: automatically deletes document at expiresAt
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for queries
pendingRegistrationSchema.index({ sessionId: 1, type: 1 });

const PendingRegistration: Model<IPendingRegistration> =
  mongoose.model<IPendingRegistration>('PendingRegistration', pendingRegistrationSchema);

export default PendingRegistration;

