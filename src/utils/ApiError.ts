/**
 * Custom operational error class.
 *
 * Usage:
 *   throw new ApiError(404, 'Item not found');
 *   throw new ApiError(400, 'Validation failed', ['field errors…']);
 */
class ApiError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errors: string[];

  constructor(
    statusCode: number,
    message: string,
    errors: string[] = [],
    stack: string = ''
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export default ApiError;
