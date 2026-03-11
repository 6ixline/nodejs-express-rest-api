const Joi = require('joi');

/**
 * Validation schema for getting all favorites
 */
const getAllFavoritesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('').trim().max(200).optional().default(''),
  makeId: Joi.alternatives().try(
    Joi.number().integer().min(1),
    Joi.string().allow('').optional()
  ).optional(),
  categoryId: Joi.alternatives().try(
    Joi.number().integer().min(1),
    Joi.string().allow('').optional()
  ).optional(),
  status: Joi.alternatives().try(
    Joi.string().valid('active', 'inactive', 'out_of_stock').allow(''),
    Joi.array().items(Joi.string().valid('active', 'inactive', 'out_of_stock'))
  ).optional(),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'mrp').default('createdAt'),
  order: Joi.string().valid('ASC', 'DESC').default('DESC')
});

module.exports = {
  getAllFavoritesSchema
};