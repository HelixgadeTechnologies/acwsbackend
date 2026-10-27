import Joi from 'joi';

const normalizePaymentTier = (value: any) => {
  if (!value || typeof value !== 'string') {
    return 'standard';
  }
  const clean = value.toLowerCase().trim();
  if (clean.includes('catwalk')) return 'catwalk';
  if (clean.includes('premium')) return 'premium';
  if (clean.includes('executive')) return 'executive';
  if (clean.includes('standard')) return 'standard';
  if (['standard', 'premium', 'catwalk', 'executive'].includes(clean)) return clean;
  return 'standard';
};

const normalizeArray = (value: any) => {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value === 'string' && value.trim() !== '') {
    return value.split(',').map((v) => v.trim()).filter(Boolean);
  }
  return [];
};

const normalizeBoolean = (value: any) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const s = value.toLowerCase().trim();
    return s === 'true' || s === 'on' || s === '1' || s === 'yes';
  }
  return Boolean(value);
};

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
  serviceAreas: Joi.alternatives().try(Joi.array(), Joi.string()).custom(normalizeArray).default([]),
  category: Joi.string().trim().min(2).max(100).required(),
  marketsServed: Joi.alternatives().try(Joi.array(), Joi.string()).custom(normalizeArray).default([]),
  weddingVolume: Joi.string().trim().allow('', null).default('Not specified'),
  typicalSpend: Joi.string().trim().allow('', null).default('Not specified'),
  objectives: Joi.alternatives().try(Joi.array(), Joi.string()).custom(normalizeArray).default([]),
  discoveryChannels: Joi.alternatives().try(Joi.array(), Joi.string()).custom(normalizeArray).default([]),
  paymentTier: Joi.alternatives()
    .try(Joi.string().allow('', null), Joi.any())
    .custom(normalizePaymentTier)
    .default('standard'),
  privacyAcknowledged: Joi.alternatives()
    .try(Joi.boolean(), Joi.string())
    .custom(normalizeBoolean)
    .default(true),
  marketingConsent: Joi.alternatives()
    .try(Joi.boolean(), Joi.string())
    .custom(normalizeBoolean)
    .default(false),
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
