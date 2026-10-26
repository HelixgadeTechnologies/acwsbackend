import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
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

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@acws.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass123!';
    const adminName = process.env.ADMIN_NAME || 'ACWS Administrator';

    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      if (admin.role !== 'admin') {
        admin.role = 'admin';
        await admin.save();
        logger.info(`Existing user "${adminEmail}" was upgraded to role "admin".`);
      } else {
        logger.info(`Admin user "${adminEmail}" already exists with role "admin".`);
      }
    } else {
      admin = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword,
        role: 'admin',
      });
      logger.info(`Admin user created successfully.`);
    }

    console.log('\n=============================================');
    console.log('✅ Admin Account Ready');
    console.log(`   Email:    ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
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
