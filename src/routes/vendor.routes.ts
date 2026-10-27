import { Router } from 'express';
import * as vendorController from '../controllers/vendor.controller';
import validate from '../middlewares/validate.middleware';
import { createVendorSchema } from './schemas/vendor.schema';

const router = Router();

/**
 * @route   POST /api/v1/vendors and POST /api/v1/vendors/register
 * @desc    Public exhibitor/vendor registration for ACWS 2027
 * @access  Public
 */
router.post('/', validate(createVendorSchema), vendorController.register);
router.post('/register', validate(createVendorSchema), vendorController.register);

/**
 * @route   GET /api/v1/vendors/public/:refCode
 * @desc    Get public exhibitor details (Business Name, Website, Instagram, Phone, Email)
 * @access  Public (Unauthenticated)
 */
router.get('/public/:refCode', vendorController.getPublicProfile);

/**
 * @route   GET /api/v1/vendors/public/:refCode/card
 * @desc    Direct mobile-friendly Digital Business Card view
 * @access  Public (Unauthenticated)
 */
router.get('/public/:refCode/card', vendorController.getVendorCard);

export default router;
