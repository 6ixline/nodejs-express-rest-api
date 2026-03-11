const Joi = require('joi');

const baseQuerySchema = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('').optional(),
  status: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional(),
  order: Joi.string().valid('asc', 'desc').insensitive().default('desc'),
  role: Joi.string().valid('normal', 'internal').insensitive().default('desc')
};

const createQuerySchema = (sortFields, defaultSort = 'createdAt') => {
  return Joi.object({
    ...baseQuerySchema,
    sortBy: Joi.string().valid(...sortFields).default(defaultSort)
  });
};

const getAllUsersSchema = createQuerySchema([
  'name', 'email', 'mobile', 'status', 'createdAt'
]);

const getAllCitiesSchema = createQuerySchema([
  'name', 'url', 'code', 'state', 'created_at'
], 'created_at');

const getAllPropertySchema = createQuerySchema([
  'title', 'service', 'name', 'mobile', 'propertyType', 'createdAt'
]);

module.exports = {
  getAllUsersSchema,
  getAllCitiesSchema,
  getAllPropertySchema
};