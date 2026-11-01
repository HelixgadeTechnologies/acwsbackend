import { Document, Types } from 'mongoose';
import { IDeviceInfo } from './device.interface';

export type PendingRegistrationType = 'attendee' | 'vendor';

export interface IPendingRegistration extends Document {
  _id: Types.ObjectId;
  sessionId?: string;
  refCode: string;
  type: PendingRegistrationType;
  data: Record<string, any>;
  deviceInfo?: IDeviceInfo | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

