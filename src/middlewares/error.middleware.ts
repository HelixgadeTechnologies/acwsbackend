import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/ApiError';
import logger from '../utils/logger';

interface MongoError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
  path?: string;
  value?: unknown;
  errors?: Record<string, { message: string }>;
}

/**
 * Global Express error handler.
 * Must be the LAST middleware registered in app.ts (4 arguments).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorMiddleware = (
  err: Error | ApiError | MongoError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  let error: ApiError;

  if (err instanceof ApiError) {
    error = err;
  } else {
    const mongoErr = err as MongoError;

    if (mongoErr.name === 'CastError') {
      error = new ApiError(400, `Invalid ${mongoErr.path}: ${mongoErr.value}`);
    } else if (mongoErr.code === 11000) {
      const field = Object.keys(mongoErr.keyValue || {})[0];
      error = new ApiError(409, `${field} already exists`);
    } else if (mongoErr.name === 'ValidationError') {
      const errors = Object.values(mongoErr.errors || {}).map((e) => e.message);
      error = new ApiError(400, 'Validation failed', errors);
    } else if (mongoErr.name === 'JsonWebTokenError') {
      error = new ApiError(401, 'Invalid token');
    } else if (mongoErr.name === 'TokenExpiredError') {
      error = new ApiError(401, 'Token expired');
    } else {
      error = new ApiError(500, 'Internal server error');
    }
  }

  if (error.statusCode >= 500) {
    logger.error(`[${req.method}] ${req.path} — ${err.message}`, { stack: err.stack });
  } else {
    logger.warn(`[${req.method}] ${req.path} — ${error.message}`);
  }

  res.status(error.statusCode).json({
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    ...(error.errors.length && { errors: error.errors }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export default errorMiddleware;
