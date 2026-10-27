import jwt from 'jsonwebtoken';
import Admin from '../models/admin.model';
import User from '../models/user.model';
import ApiError from '../utils/ApiError';
import { AdminLoginInput, AdminAuthResult } from '../interfaces/admin.interface';

const signToken = (id: string): string =>
  jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  });

export const loginAdmin = async (data: AdminLoginInput): Promise<AdminAuthResult> => {
  if (!data.email || !data.password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const cleanEmail = data.email.toLowerCase().trim();

  // Check Admin collection first
  let admin: any = await Admin.findOne({ email: cleanEmail }).select('+password');

  // Fallback to User collection for accounts seeded in User collection
  if (!admin) {
    admin = await User.findOne({ email: cleanEmail }).select('+password');
  }

  if (!admin || !(await admin.comparePassword(data.password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const allowedRoles = ['admin', 'superadmin', 'curator'];
  if (!allowedRoles.includes(admin.role)) {
    throw new ApiError(403, 'Access denied. Administrator privileges required.');
  }

  const token = signToken(admin._id.toString());

  return {
    user: {
      _id: admin._id.toString(),
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
    token,
  };
};
