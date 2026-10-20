import Joi from 'joi';

export const createItemSchema = Joi.object({
  title: Joi.string().min(3).max(120).required(),
  description: Joi.string().max(1000).allow('').default(''),
  price: Joi.number().min(0).required(),
  inStock: Joi.boolean().default(true),
});

export const updateItemSchema = Joi.object({
  title: Joi.string().min(3).max(120),
  description: Joi.string().max(1000).allow(''),
  price: Joi.number().min(0),
  inStock: Joi.boolean(),
}).min(1); // At least one field required
