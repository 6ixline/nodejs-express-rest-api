const Joi = require('joi');

const baseQuerySchema = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  city: Joi.number().integer().optional(),
  search: Joi.string().allow('').optional(),
  type: Joi.string().allow('').optional(),
  status: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional(),
  order: Joi.string().valid('asc', 'desc').insensitive().default('desc')
};

const createQuerySchema = (sortFields, defaultSort = 'createdAt') => {
  return Joi.object({
    ...baseQuerySchema,
    sortBy: Joi.string().valid(...sortFields).default(defaultSort)
  });
};

const getAllPropertySchema = createQuerySchema([
  'title', 'service', 'price', 'name', 'mobile', 'propertyType', 'createdAt'
]);

module.exports = {
  getAllPropertySchema
};