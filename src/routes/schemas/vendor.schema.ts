import Joi from 'joi';

export const createVendorSchema = Joi.object({
  refCode: Joi.string().trim().uppercase().optional(),
  businessName: Joi.string().trim().min(2).max(150).required(),
  contactPerson: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().lowercase().trim().required(),
  phone: Joi.string().trim().min(7).max(30).required(),
  instagram: Joi.string().trim().min(1).max(100).required(),
  website: Joi.string().trim().allow('', null).default('N/A'),
  baseLocation: Joi.string().trim().min(2).max(120).required(),
  serviceAreas: Joi.array()
    .items(Joi.string().trim().min(1))
    .min(1)
    .required()
    .messages({
      'array.min': 'Please select at least one service area',
    }),
  category: Joi.string().trim().min(2).max(100).required(),
  marketsServed: Joi.array()
    .items(Joi.string().trim().min(1))
    .min(1)
    .required()
    .messages({
      'array.min': 'Please select at least one market served',
    }),
  weddingVolume: Joi.string().trim().allow('', null).default('Not specified'),
  typicalSpend: Joi.string().trim().allow('', null).default('Not specified'),
  objectives: Joi.array()
    .items(Joi.string().trim().min(1))
    .min(1)
    .max(3)
    .required()
    .messages({
      'array.min': 'Please select between 1 and 3 objectives',
      'array.max': 'You can select at most 3 objectives',
    }),
  discoveryChannels: Joi.array()
    .items(Joi.string().trim().min(1))
    .min(1)
    .max(3)
    .required()
    .messages({
      'array.min': 'Please select between 1 and 3 discovery channels',
      'array.max': 'You can select at most 3 discovery channels',
    }),
  paymentTier: Joi.string()
    .valid('standard', 'premium', 'catwalk')
    .required()
    .messages({
      'any.only': 'Payment tier must be standard, premium, or catwalk',
    }),
  privacyAcknowledged: Joi.boolean()
    .valid(true)
    .required()
    .messages({
      'any.only': 'You must acknowledge the privacy policy to register',
    }),
  marketingConsent: Joi.boolean().default(false),
});

export const updateVendorStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'approved', 'rejected', 'waitlisted')
    .required()
    .messages({
      'any.only': 'Status must be pending, approved, rejected, or waitlisted',
    }),
});

export const vendorQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('pending', 'approved', 'rejected', 'waitlisted').optional(),
  category: Joi.string().trim().optional(),
  paymentTier: Joi.string().valid('standard', 'premium', 'catwalk').optional(),
  search: Joi.string().trim().allow('').optional(),
  sortBy: Joi.string().trim().default('-createdAt'),
});
