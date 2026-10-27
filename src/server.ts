import dotenv from 'dotenv';
dotenv.config();

// Load and validate environment variables first
import './config/env';

import app from './app';
import connectDB from './config/db';
import { bootstrapSuperadmin } from './config/bootstrap';
import logger from './utils/logger';

const PORT = parseInt(process.env.PORT || '5000', 10);

// ── Boot sequence ──────────────────────────────────────────────────────────
(async () => {
  await connectDB();
  await bootstrapSuperadmin();

  const server = app.listen(PORT, () => {
    logger.info(`🚀  Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  });

  // ── Graceful shutdown ────────────────────────────────────────────────────
  const shutdown = (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully`);
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // ── Unhandled promise rejections ─────────────────────────────────────────
  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled Rejection:', reason);
    server.close(() => process.exit(1));
  });
})();
