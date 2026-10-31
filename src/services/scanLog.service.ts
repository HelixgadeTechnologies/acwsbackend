import ScanLog from '../models/scanLog.model';
import Attendee from '../models/attendee.model';
import Vendor from '../models/vendor.model';
import { IDeviceInfo } from '../interfaces/device.interface';
import logger from '../utils/logger';

/**
 * Records a QR code scan event and updates target document scan counters & last device
 */
export const recordScanEvent = async (
  refCode: string,
  deviceInfo: IDeviceInfo
): Promise<void> => {
  try {
    const cleanCode = refCode.toUpperCase().trim();
    const isAtt = cleanCode.includes('ATT');
    const isVnd = cleanCode.includes('VND');

    // 1. Try finding Attendee
    if (isAtt || !isVnd) {
      const attendee = await Attendee.findOne({ refCode: cleanCode });
      if (attendee) {
        attendee.lastScannedDevice = deviceInfo;
        attendee.scanCount = (attendee.scanCount || 0) + 1;
        await attendee.save();

        await ScanLog.create({
          refCode: cleanCode,
          targetType: 'attendee',
          targetId: attendee._id,
          targetModel: 'Attendee',
          deviceInfo,
          scannedAt: new Date(),
        });
        return;
      }
    }

    // 2. Try finding Vendor
    const vendor = await Vendor.findOne({ refCode: cleanCode });
    if (vendor) {
      vendor.lastScannedDevice = deviceInfo;
      vendor.scanCount = (vendor.scanCount || 0) + 1;
      await vendor.save();

      await ScanLog.create({
        refCode: cleanCode,
        targetType: 'vendor',
        targetId: vendor._id,
        targetModel: 'Vendor',
        deviceInfo,
        scannedAt: new Date(),
      });
    }
  } catch (err: any) {
    // Non-blocking for scan view
    logger.warn(`Failed to record scan event for ${refCode}: ${err.message}`);
  }
};

/**
 * Retrieves scan audit history for a given reference code
 */
export const getScanLogsForRef = async (refCode: string, limit = 50) => {
  const cleanCode = refCode.toUpperCase().trim();
  return ScanLog.find({ refCode: cleanCode }).sort({ scannedAt: -1 }).limit(limit);
};

