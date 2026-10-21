import jwt from 'jsonwebtoken';
import User from '../models/user.model';
import ApiError from '../utils/ApiError';
import { RegisterInput, LoginInput, AuthResult } from '../interfaces/auth.interface';

const signToken = (id: string): string =>
  jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  });

/**
 * Registers a new user account.
 */
export const register = async (data: RegisterInput): Promise<AuthResult> => {
  const existing = await User.findOne({ email: data.email });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const user = await User.create(data);
  const token = signToken(user._id.toString());

  return { user, token };
};

/**
 * Authenticates a user and returns a JWT.
 */
export const login = async (data: LoginInput): Promise<AuthResult> => {
  const user = await User.findOne({ email: data.email }).select('+password');

  if (!user || !(await user.comparePassword(data.password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = signToken(user._id.toString());

  return { user, token };
};
