import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Vendor from '../models/vendor.model';
import logger from '../utils/logger';
import { buildPublicProfileUrl } from '../services/vendor.service';
import { generateQRCodeDataUrl } from '../services/qrcode.service';

const backfillQRCodes = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is missing from environment variables');
    }

    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB for QR code backfill.');

    const vendorsWithoutQR = await Vendor.find({
      $or: [{ qrCode: { $exists: false } }, { qrCode: '' }, { qrCode: null }],
    });

    logger.info(`Found ${vendorsWithoutQR.length} vendor(s) requiring QR code generation.`);

    for (const vendor of vendorsWithoutQR) {
      const publicProfileUrl = buildPublicProfileUrl(vendor.refCode);
      const qrCode = await generateQRCodeDataUrl(publicProfileUrl);

      vendor.publicProfileUrl = publicProfileUrl;
      vendor.qrCode = qrCode;
      await vendor.save();

      logger.info(`Updated vendor ${vendor.businessName} (${vendor.refCode})`);
    }

    console.log(`\n✅ Finished backfilling ${vendorsWithoutQR.length} vendor QR codes.\n`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    logger.error('QR code backfill failed:', err);
    process.exit(1);
  }
};

backfillQRCodes();
