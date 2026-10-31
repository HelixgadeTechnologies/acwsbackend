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
import * as paymentController from './controllers/payment.controller';
import logger from './utils/logger';

const app: Application = express();

// Trust reverse proxies (Render, Vercel, Nginx, Cloudflare) for accurate client IP tracking
app.set('trust proxy', 1);

// ── Security headers ───────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

// ── CORS ───────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  ...(process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean),
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      if (
        process.env.NODE_ENV !== 'production' ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.onrender.com') ||
        origin.includes('acws')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  })
);
app.options('*', cors());

// ── Swagger documentation ──────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/api-docs.json', (_req: Request, res: Response) => {
  res.status(200).json(swaggerDocument);
});

// ── Rate limiting ─────────────────────────────────────────────────────────
app.use(limiter);

// ── Stripe Webhook (Raw Buffer parser required before express.json) ────────
app.post(
  '/api/v1/payments/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.handleWebhook
);

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

// ── Root endpoint ────────────────────────────────────────────────────────
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'African & Caribbean Wedding Show 2027 (ACWS) Backend API',
    status: 'online',
    documentation: '/api-docs',
    health: '/health',
    apiBase: '/api/v1',
  });
});

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
