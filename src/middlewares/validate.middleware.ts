import { Request, Response, NextFunction, RequestHandler } from 'express';
import Joi from 'joi';
import ApiError from '../utils/ApiError';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Joi validation middleware factory.
 *
 * Usage:
 *   router.post('/', validate(myJoiSchema), controller);
 */
const validate =
  (schema: Joi.Schema, target: ValidationTarget = 'body'): RequestHandler =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((d) => d.message.replace(/['"]/g, ''));
      return next(new ApiError(422, 'Validation failed', errors));
    }

    if (target === 'body') {
      req.body = value;
    } else if (target === 'query') {
      req.query = value;
    } else if (target === 'params') {
      req.params = value;
    }

    next();
  };

export default validate;
