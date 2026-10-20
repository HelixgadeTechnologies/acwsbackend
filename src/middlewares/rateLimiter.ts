import rateLimit from 'express-rate-limit';

/**
 * General limiter — 100 requests per 15 minutes per IP.
 * Applied globally in app.ts.
 */
export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

/**
 * Strict limiter for auth routes — 10 attempts per 15 minutes per IP.
 * Protects against brute-force login attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: 'Too many login attempts from this IP, please try again after 15 minutes.',
  },
});
