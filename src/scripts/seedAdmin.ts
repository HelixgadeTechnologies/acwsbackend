import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import Admin from '../models/admin.model';
import User from '../models/user.model';
import logger from '../utils/logger';

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is missing from environment variables');
    }

    await mongoose.connect(mongoUri);
    logger.info('Connected to MongoDB for admin seeding.');

    const superadminEmail = (process.env.ADMIN_EMAIL || 'admin@acws.co.uk').toLowerCase().trim();
    const superadminPassword = process.env.ADMIN_PASSWORD || 'Password123!';
    const superadminName = process.env.ADMIN_NAME || 'ACWS Executive Curator';
    const superadminRole = 'superadmin';

    // Seed into Admin collection
    let admin = await Admin.findOne({ email: superadminEmail });
    if (admin) {
      admin.role = 'superadmin';
      admin.name = superadminName;
      admin.password = superadminPassword;
      await admin.save();
      logger.info(`Updated Admin account "${superadminEmail}".`);
    } else {
      admin = await Admin.create({
        name: superadminName,
        email: superadminEmail,
        password: superadminPassword,
        role: superadminRole,
      });
      logger.info(`Created new Superadmin account in Admin collection.`);
    }

    // Mirror to User collection
    let user = await User.findOne({ email: superadminEmail });
    if (user) {
      user.role = 'admin';
      user.name = superadminName;
      user.password = superadminPassword;
      await user.save();
    } else {
      await User.create({
        name: superadminName,
        email: superadminEmail,
        password: superadminPassword,
        role: 'admin',
      });
    }

    console.log('\n=============================================');
    console.log('✅ ACWS Superadmin Account Ready');
    console.log(`   Email:    ${superadminEmail}`);
    console.log(`   Password: ${superadminPassword}`);
    console.log(`   Role:     ${admin.role}`);
    console.log('=============================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    logger.error('Admin seeding failed:', err);
    process.exit(1);
  }
};

seedAdmin();
