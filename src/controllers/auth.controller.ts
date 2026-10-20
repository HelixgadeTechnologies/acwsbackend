import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import asyncHandler from '../utils/asyncHandler';
import ApiResponse from '../utils/ApiResponse';

/**
 * POST /api/v1/auth/register
 */
export const register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { user, token } = await authService.register(req.body);
  res.status(201).json(new ApiResponse(201, { user, token }, 'Account created successfully'));
});

/**
 * POST /api/v1/auth/login
 */
export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { user, token } = await authService.login(req.body);
  res.status(200).json(new ApiResponse(200, { user, token }, 'Logged in successfully'));
});
