import { Router } from 'express';
import * as adminVendorController from '../controllers/admin.vendor.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import validate from '../middlewares/validate.middleware';
import {
  vendorQuerySchema,
  updateVendorStatusSchema,
} from './schemas/vendor.schema';

const router = Router();

// Protect all admin vendor routes with JWT and role check
router.use(protect, restrictTo('admin'));

/**
 * @route   GET /api/v1/admin/vendors/summary/stats
 * @desc    Get aggregate vendor statistics (by status, tier, category)
 * @access  Admin only
 */
router.get('/summary/stats', adminVendorController.getVendorStats);

/**
 * @route   GET /api/v1/admin/vendors
 * @desc    Get paginated vendor submissions with search & filters
 * @access  Admin only
 */
router.get('/', validate(vendorQuerySchema, 'query'), adminVendorController.getVendors);

/**
 * @route   GET /api/v1/admin/vendors/:id
 * @desc    Get full submission details for a specific vendor
 * @access  Admin only
 */
router.get('/:id', adminVendorController.getVendorById);

/**
 * @route   PATCH /api/v1/admin/vendors/:id/status
 * @desc    Update vendor application status (pending, approved, rejected, waitlisted)
 * @access  Admin only
 */
router.patch(
  '/:id/status',
  validate(updateVendorStatusSchema),
  adminVendorController.updateVendorStatus
);

export default router;
