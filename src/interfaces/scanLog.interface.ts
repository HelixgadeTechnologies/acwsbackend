import { Document, Types } from 'mongoose';
import { IDeviceInfo } from './device.interface';

export type ScanTargetType = 'attendee' | 'vendor';

export interface IScanLog extends Document {
  _id: Types.ObjectId;
  refCode: string;
  targetType: ScanTargetType;
  targetId: Types.ObjectId;
  targetModel: 'Attendee' | 'Vendor';
  deviceInfo: IDeviceInfo;
  scannedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

