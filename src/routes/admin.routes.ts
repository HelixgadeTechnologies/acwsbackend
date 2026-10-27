import { Router } from 'express';
import * as adminAuthController from '../controllers/admin.auth.controller';
import { protectAdmin } from '../middlewares/auth.middleware';
import validate from '../middlewares/validate.middleware';
import { loginSchema } from './schemas/auth.schema';
import adminVendorRoutes from './admin.vendor.routes';
import adminAttendeeRoutes from './admin.attendee.routes';

const router = Router();

/**
 * @route   POST /api/v1/admin/login
 * @desc    Authenticate administrator and return JWT token
 * @access  Public
 */
router.post('/login', validate(loginSchema), adminAuthController.adminLogin);

/**
 * @route   GET /api/v1/admin/me
 * @desc    Get current authenticated administrator profile
 * @access  Admin only
 */
router.get('/me', protectAdmin, adminAuthController.getAdminMe);

/**
 * Sub-routes for admin vendor management
 * @route   /api/v1/admin/vendors
 */
router.use('/vendors', adminVendorRoutes);

/**
 * Sub-routes for admin attendee management
 * @route   /api/v1/admin/attendees
 */
router.use('/attendees', adminAttendeeRoutes);

export default router;
