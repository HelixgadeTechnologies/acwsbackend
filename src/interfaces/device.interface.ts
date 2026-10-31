export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'unknown';

export interface IDeviceInfo {
  ip: string;
  userAgent: string;
  deviceType: DeviceType;
  os: string;
  browser: string;
  capturedAt: Date;
}

