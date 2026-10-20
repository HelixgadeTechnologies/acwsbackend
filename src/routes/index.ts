import { Router } from 'express';
import authRoutes from './auth.routes';
import itemRoutes from './item.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/items', itemRoutes);

// Add new resources here:
// router.use('/users', userRoutes);
// router.use('/orders', orderRoutes);

export default router;
