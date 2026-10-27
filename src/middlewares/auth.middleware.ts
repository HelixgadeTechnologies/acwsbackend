import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/asyncHandler';
import ApiError from '../utils/ApiError';
import User from '../models/user.model';
import Admin from '../models/admin.model';
import { JwtPayload } from '../interfaces/auth.interface';

/**
 * Protects routes by verifying the Bearer JWT.
 * Attaches the authenticated user to req.user on success.
 */
export const protect = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication required. Please log in.');
    }

    const token = authHeader.split(' ')[1];

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    } catch (err) {
      if ((err as Error).name === 'TokenExpiredError') {
        throw new ApiError(401, 'Your session has expired. Please log in again.');
      }
      throw new ApiError(401, 'Invalid token. Please log in again.');
    }

    // Try finding in Admin collection first, then User collection
    let user: any = await Admin.findById(decoded.id).select('-password');
    if (!user) {
      user = await User.findById(decoded.id).select('-password');
    }

    if (!user) {
      throw new ApiError(401, 'User belonging to this token no longer exists.');
    }

    req.user = user;
    req.admin = user;
    next();
  }
);

/**
 * Protects admin-only routes.
 * Ensures the authenticated user has a role of 'admin', 'superadmin', or 'curator'.
 */
export const protectAdmin = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication required. Please log in.');
    }

    const token = authHeader.split(' ')[1];

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    } catch (err) {
      if ((err as Error).name === 'TokenExpiredError') {
        throw new ApiError(401, 'Your session has expired. Please log in again.');
      }
      throw new ApiError(401, 'Invalid token. Please log in again.');
    }

    // Check Admin collection first, then fallback to User collection
    let admin: any = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      admin = await User.findById(decoded.id).select('-password');
    }

    if (!admin) {
      throw new ApiError(401, 'Administrator account not found or has been revoked.');
    }

    const allowedRoles = ['admin', 'superadmin', 'curator'];
    if (!allowedRoles.includes(admin.role)) {
      throw new ApiError(403, 'Access denied. Administrator privileges required.');
    }

    req.user = admin;
    req.admin = admin;
    next();
  }
);

/**
 * Role-based access control factory.
 * Usage: restrictTo('admin', 'superadmin')
 */
export const restrictTo =
  (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const role = req.admin?.role || req.user?.role;
    if (!role || !roles.includes(role)) {
      return next(new ApiError(403, 'You do not have permission to perform this action.'));
    }
    next();
  };
