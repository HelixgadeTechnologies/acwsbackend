import { Router } from 'express';
import authRoutes from './auth.routes';
import itemRoutes from './item.routes';
import vendorRoutes from './vendor.routes';
import attendeeRoutes from './attendee.routes';
import adminRoutes from './admin.routes';
import adminVendorRoutes from './admin.vendor.routes';
import adminAttendeeRoutes from './admin.attendee.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/items', itemRoutes);
router.use('/vendors', vendorRoutes);
router.use('/attendees', attendeeRoutes);
router.use('/admin', adminRoutes);
router.use('/admin/vendors', adminVendorRoutes);
router.use('/admin/attendees', adminAttendeeRoutes);

export default router;
