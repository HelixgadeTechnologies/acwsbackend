import Admin from '../models/admin.model';
import User from '../models/user.model';
import logger from '../utils/logger';

/**
 * Automatically bootstraps initial superadmin account if none exists.
 */
export const bootstrapSuperadmin = async (): Promise<void> => {
  try {
    const defaultEmail = 'admin@acws.co.uk';
    const defaultPassword = 'Password123!';
    const defaultName = 'ACWS Executive Curator';
    const defaultRole = 'superadmin';

    let admin = await Admin.findOne({ email: defaultEmail });
    if (!admin) {
      admin = await Admin.create({
        name: defaultName,
        email: defaultEmail,
        password: defaultPassword,
        role: defaultRole,
      });
      logger.info(`✅ Default Superadmin created: ${defaultEmail} (${defaultRole})`);
    }

    // Also mirror to User collection for universal backward compatibility
    let user = await User.findOne({ email: defaultEmail });
    if (!user) {
      await User.create({
        name: defaultName,
        email: defaultEmail,
        password: defaultPassword,
        role: 'admin',
      });
    }
  } catch (err) {
    logger.error('Superadmin bootstrap error:', err);
  }
};
