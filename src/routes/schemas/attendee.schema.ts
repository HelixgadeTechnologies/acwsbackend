import Joi from 'joi';

export const attendeeQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().allow('').optional(),
  ticketType: Joi.string().valid('standard', 'vip', 'catwalk-exclusive').optional(),
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
        ticketType: Joi.string().valid('standard', 'vip', 'catwalk-exclusive').default('standard'),
        pricePaid: Joi.number().min(0).optional().default(0),
        paymentStatus: Joi.string().valid('paid', 'pending', 'complimentary').default('paid'),
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
