import Joi from 'joi';

export const createVendorSchema = Joi.object({
  refCode: Joi.string().trim().uppercase().optional(),
  businessName: Joi.string().trim().min(2).max(150).required(),
  contactPerson: Joi.string().trim().min(2).max(100).allow('', null).optional(),
  contactName: Joi.string().trim().min(2).max(100).allow('', null).optional(),
  email: Joi.string().email().lowercase().trim().required(),
  phone: Joi.string().trim().allow('', null).optional().default(''),
  instagram: Joi.string().trim().allow('', null).optional().default(''),
  website: Joi.string().trim().allow('', null).default('N/A'),
  baseLocation: Joi.string().trim().allow('', null).default('London, Greater London'),
  serviceAreas: Joi.array().items(Joi.string().trim()).default([]),
  category: Joi.string().trim().min(2).max(100).required(),
  marketsServed: Joi.array().items(Joi.string().trim()).default([]),
  weddingVolume: Joi.string().trim().allow('', null).default('Not specified'),
  typicalSpend: Joi.string().trim().allow('', null).default('Not specified'),
  objectives: Joi.array().items(Joi.string().trim()).default([]),
  discoveryChannels: Joi.array().items(Joi.string().trim()).default([]),
  paymentTier: Joi.string()
    .valid('standard', 'premium', 'catwalk', 'executive')
    .default('standard'),
  privacyAcknowledged: Joi.boolean().default(true),
  marketingConsent: Joi.boolean().default(false),
  notes: Joi.string().allow('', null).optional(),
  curatorNotes: Joi.string().allow('', null).optional(),
});

export const updateVendorStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'approved', 'rejected', 'waitlisted')
    .required()
    .messages({
      'any.only': 'Status must be pending, approved, rejected, or waitlisted',
    }),
  notes: Joi.string().allow('', null).optional(),
  curatorNotes: Joi.string().allow('', null).optional(),
});

export const vendorQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('pending', 'approved', 'rejected', 'waitlisted').optional(),
  category: Joi.string().trim().optional(),
  paymentTier: Joi.string().valid('standard', 'premium', 'catwalk', 'executive').optional(),
  search: Joi.string().trim().allow('').optional(),
  sortBy: Joi.string().trim().default('-createdAt'),
});
