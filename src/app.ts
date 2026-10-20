import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import swaggerDocument from './docs/swagger.json';
import { limiter } from './middlewares/rateLimiter';
import routes from './routes/index';
import errorMiddleware from './middlewares/error.middleware';
import logger from './utils/logger';

const app: Application = express();

// ── Security headers ───────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

// ── CORS ───────────────────────────────────────────────────────────────────
app.use(cors());

// ── Swagger documentation ──────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/api-docs.json', (_req: Request, res: Response) => {
  res.status(200).json(swaggerDocument);
});

// ── Rate limiting ─────────────────────────────────────────────────────────
app.use(limiter);

// ── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── NoSQL injection sanitisation ─────────────────────────────────────────
app.use(mongoSanitize());

// ── HTTP parameter pollution prevention ──────────────────────────────────
app.use(hpp());

// ── HTTP request logging ──────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: { write: (msg: string) => logger.http(msg.trim()) },
    })
  );
}

// ── Health check ──────────────────────────────────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API routes ────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ── 404 handler ───────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────
app.use(errorMiddleware);

export default app;
