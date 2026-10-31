import { Request } from 'express';
import { IDeviceInfo, DeviceType } from '../interfaces/device.interface';

/**
 * Extracts and parses client device information from an Express request
 */
export const extractDeviceInfo = (req: Request): IDeviceInfo => {
  const forwarded = req.headers['x-forwarded-for'];
  let ip = '';
  if (typeof forwarded === 'string') {
    ip = forwarded.split(',')[0].trim();
  } else if (Array.isArray(forwarded) && forwarded.length > 0) {
    ip = forwarded[0].trim();
  } else {
    ip = req.ip || req.socket?.remoteAddress || '';
  }

  // Normalize IPv6 localhost & IPv4-mapped IPv6 addresses
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  } else if (ip.startsWith('::ffff:')) {
    ip = ip.replace('::ffff:', '');
  }

  const userAgent = (req.headers['user-agent'] as string) || '';

  // Determine Device Form Factor
  let deviceType: DeviceType = 'unknown';
  if (/ipad|tablet|playbook|silk/i.test(userAgent)) {
    deviceType = 'tablet';
  } else if (
    /mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(userAgent)
  ) {
    deviceType = 'mobile';
  } else if (/windows|macintosh|linux|cros/i.test(userAgent)) {
    deviceType = 'desktop';
  }

  // Determine Operating System
  let os = 'Unknown OS';
  if (/iphone|ipad|ipod/i.test(userAgent)) {
    os = 'iOS';
  } else if (/android/i.test(userAgent)) {
    os = 'Android';
  } else if (/macintosh|mac os x/i.test(userAgent)) {
    os = 'macOS';
  } else if (/windows nt 10/i.test(userAgent)) {
    os = 'Windows 10/11';
  } else if (/windows/i.test(userAgent)) {
    os = 'Windows';
  } else if (/cros/i.test(userAgent)) {
    os = 'ChromeOS';
  } else if (/linux/i.test(userAgent)) {
    os = 'Linux';
  }

  // Determine Web Browser
  let browser = 'Unknown Browser';
  if (/edg\//i.test(userAgent)) {
    browser = 'Microsoft Edge';
  } else if (/opr\/|opera/i.test(userAgent)) {
    browser = 'Opera';
  } else if (/chrome|crios/i.test(userAgent)) {
    browser = 'Chrome';
  } else if (/firefox|fxios/i.test(userAgent)) {
    browser = 'Firefox';
  } else if (/safari/i.test(userAgent) && !/chrome|crios|android/i.test(userAgent)) {
    browser = 'Safari';
  }

  return {
    ip,
    userAgent,
    deviceType,
    os,
    browser,
    capturedAt: new Date(),
  };
};

