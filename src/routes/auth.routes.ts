import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import validate from '../middlewares/validate.middleware';
import { authLimiter } from '../middlewares/rateLimiter';
import { registerSchema, loginSchema } from './schemas/auth.schema';

const router = Router();

router.use(authLimiter);

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login and receive a JWT
 * @access  Public
 */
router.post('/login', validate(loginSchema), authController.login);

export default router;
