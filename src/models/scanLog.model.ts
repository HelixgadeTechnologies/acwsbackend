import mongoose, { Schema, Model } from 'mongoose';
import { IScanLog } from '../interfaces/scanLog.interface';
import { deviceInfoSchema } from './deviceInfo.schema';

const scanLogSchema = new Schema<IScanLog>(
  {
    refCode: {
      type: String,
      required: true,
      index: true,
      trim: true,
      uppercase: true,
    },
    targetType: {
      type: String,
      enum: ['attendee', 'vendor'],
      required: true,
      index: true,
    },
    targetId: {
      type: Schema.Types.ObjectId,
      required: true,
      refPath: 'targetModel',
      index: true,
    },
    targetModel: {
      type: String,
      enum: ['Attendee', 'Vendor'],
      required: true,
    },
    deviceInfo: {
      type: deviceInfoSchema,
      required: true,
    },
    scannedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying scan logs by refCode and time
scanLogSchema.index({ refCode: 1, scannedAt: -1 });

const ScanLog: Model<IScanLog> = mongoose.model<IScanLog>('ScanLog', scanLogSchema);

export default ScanLog;

