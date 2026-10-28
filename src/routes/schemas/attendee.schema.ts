import Joi from 'joi';

export const createAttendeeSchema = Joi.object({
  fullName: Joi.string().trim().min(2).max(120).required().messages({
    'string.empty': 'Full name is required',
    'string.min': 'Full name must be at least 2 characters',
  }),
  email: Joi.string().email().lowercase().trim().required().messages({
    'string.email': 'Please provide a valid email address',
    'string.empty': 'Email address is required',
  }),
  phone: Joi.string().trim().allow('', null).optional().default(''),
  attendeeType: Joi.string()
    .valid(
      'Bride',
      'Groom',
      'Engaged Couple',
      'Partner/Fiancé(e)',
      'Family or Friend',
      'Wedding Professional',
      'Other'
    )
    .required()
    .messages({
      'any.only': 'Attendee type must be one of the specified options',
      'string.empty': 'Please select your attendee type',
    }),
  weddingTimeframe: Joi.string().trim().allow('', null).optional().default(''),
  weddingLocation: Joi.string().trim().allow('', null).optional().default(''),
  weddingBudget: Joi.string().trim().allow('', null).optional().default('Not specified'),
  guestCount: Joi.string().trim().allow('', null).optional().default('Not specified'),
  servicesNeeded: Joi.array().items(Joi.string().trim()).default([]),
  culturalInfluences: Joi.array().items(Joi.string().trim()).default([]),
  discoveryChannel: Joi.string().trim().allow('', null).optional().default('Instagram'),
  ticketType: Joi.string().trim().required().messages({
    'string.empty': 'Ticket type is required',
  }),
  ticketPrice: Joi.string().trim().allow('', null).optional().default('£20'),
  privacyAcknowledged: Joi.boolean().valid(true).required().messages({
    'any.only': 'You must acknowledge the Privacy Notice to register',
  }),
  marketingConsent: Joi.boolean().default(false),
  partnerConsent: Joi.boolean().default(false),
});

export const attendeeQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().allow('').optional(),
  ticketType: Joi.string().optional(),
  attendeeType: Joi.string().optional(),
  checkedIn: Joi.alternatives().try(Joi.boolean(), Joi.string().valid('true', 'false')).optional(),
  sortBy: Joi.string().trim().default('-registeredAt'),
});

export const batchAttendeesSchema = Joi.object({
  attendees: Joi.array()
    .items(
      Joi.object({
        fullName: Joi.string().trim().required(),
        email: Joi.string().email().lowercase().trim().required(),
        phone: Joi.string().trim().allow('', null).optional(),
        partnerName: Joi.string().trim().allow('', null).optional(),
        ticketType: Joi.string().default('General Admission'),
        pricePaid: Joi.number().min(0).optional().default(0),
        paymentStatus: Joi.string().valid('paid', 'pending', 'failed', 'complimentary').default('paid'),
        weddingDate: Joi.string().allow('', null).optional(),
        fastTrackPass: Joi.boolean().default(false),
        checkedIn: Joi.boolean().default(false),
      })
    )
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one attendee is required in the batch',
    }),
});
