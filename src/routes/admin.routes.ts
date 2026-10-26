import { Router } from 'express';
import { adminLogin } from '../controllers/admin.vendor.controller';
import validate from '../middlewares/validate.middleware';
import { loginSchema } from './schemas/auth.schema';
import adminVendorRoutes from './admin.vendor.routes';

const router = Router();

/**
 * @route   POST /api/v1/admin/login
 * @desc    Authenticate administrator and return JWT token
 * @access  Public
 */
router.post('/login', validate(loginSchema), adminLogin);

/**
 * Sub-routes for admin vendor management
 * @route   /api/v1/admin/vendors
 */
router.use('/vendors', adminVendorRoutes);

export default router;
