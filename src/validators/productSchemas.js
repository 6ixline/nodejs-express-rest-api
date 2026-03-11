const Joi = require('joi');

// Base query schema - reusable pattern
const baseQuerySchema = {
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().allow('').optional(),
  status: Joi.alternatives().try(
    Joi.string().allow(''),
    Joi.array().items(Joi.string())
  ).optional(),
  order: Joi.string().valid('asc', 'desc').insensitive().default('desc')
};

// Helper function to create query schemas
const createQuerySchema = (sortFields, defaultSort = 'createdAt') => {
  return Joi.object({
    ...baseQuerySchema,
    sortBy: Joi.string().valid(...sortFields).default(defaultSort)
  });
};

// ==================== MAKE SCHEMAS ====================
const getAllMakesSchema = createQuerySchema(['title', 'slug', 'createdAt']);

const createMakeSchema = Joi.object({
  title: Joi.string().min(2).max(100).required(),
  slug: Joi.string().min(2).max(100).required(),
  status: Joi.string().valid('active', 'inactive').allow('').default('active')
});

const updateMakeSchema = Joi.object({
  title: Joi.string().min(2).max(100).allow('').optional(),
  slug: Joi.string().min(2).max(100).allow('').optional(),
  status: Joi.string().valid('active', 'inactive').allow('').optional()
}).min(1);

// ==================== CATEGORY SCHEMAS ====================
const getAllCategoriesSchema = createQuerySchema(['title', 'slug', 'createdAt']);

const createCategorySchema = Joi.object({
  title: Joi.string().min(2).max(100).required(),
  slug: Joi.string().min(2).max(100).required(),
  description: Joi.string().allow('').max(500).optional(),
  status: Joi.string().valid('active', 'inactive').allow('').default('active')
});

const updateCategorySchema = Joi.object({
  title: Joi.string().min(2).max(100).allow('').optional(),
  slug: Joi.string().min(2).max(100).allow('').optional(),
  description: Joi.string().allow('').max(500).optional(),
  status: Joi.string().valid('active', 'inactive').allow('').optional()
}).min(1);

// ==================== PRODUCT SCHEMAS (MERGED) ====================
const productDataSchema = Joi.object({
  makeId: Joi.number().integer().positive().required(),
  categoryId: Joi.number().integer().positive().required(),
  name: Joi.string().min(2).max(200).required(),
  product_code: Joi.string().min(2).max(100).required(),
  ref_code: Joi.string().max(500).allow('', null).optional(),
  keyword: Joi.string().max(500).allow('', null).optional(),
  color: Joi.string().max(50).allow('', null).optional(),
  mrp: Joi.number().precision(2).min(0).allow(null).optional(),
  std_pkg: Joi.string().max(50).allow('', null).optional(),
  mast_pkg: Joi.string().max(50).allow('', null).optional(),
  lumax_part_no: Joi.string().max(100).allow('', null).optional(),
  varroc_part_no: Joi.string().max(100).allow('', null).optional(),
  butter_size: Joi.string().max(50).allow('', null).optional(),
  pt_bc: Joi.string().max(50).allow('', null).optional(),
  pt_tc: Joi.string().max(50).allow('', null).optional(),
  shell_name: Joi.string().max(100).allow('', null).optional(),
  ic_box_size: Joi.string().max(50).allow('', null).optional(),
  mc_box_size: Joi.string().max(50).allow('', null).optional(),
  graphic: Joi.string().max(255).allow('', null).optional(),
  varroc_mrp: Joi.number().precision(2).min(0).allow(null).optional(),
  lumax_mrp: Joi.number().precision(2).min(0).allow(null).optional(),
  visor_glass: Joi.string().max(100).allow('', null).optional(),
  status: Joi.string().valid('active', 'inactive', 'out_of_stock').allow('').default('active')
});

const getAllProductsSchema = Joi.object({
  ...baseQuerySchema,
  makeId: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().allow('').valid('')
  ).optional(),
  categoryId: Joi.alternatives().try(
    Joi.number().integer().positive(),
    Joi.string().allow('').valid('')
  ).optional(),
  refCode: Joi.string().allow('').optional(),
  sortBy: Joi.string().valid('createdAt', 'name', 'product_code', 'mrp').default('createdAt')
});

const createProductSchema = Joi.object({
  productData: productDataSchema.required(),
  imageIds: Joi.array().items(Joi.number().integer().positive()).optional()
});

const updateProductSchema = Joi.object({
  productData: productDataSchema.fork(
    ['makeId', 'categoryId', 'name', 'product_code'],
    (schema) => schema.optional()
  ).optional(),
  imageIds: Joi.array().items(Joi.number().integer().positive()).optional(),
  imagesToDelete: Joi.array().items(Joi.number().integer().positive()).optional()
}).min(1);

// ==================== COMMON SCHEMAS ====================
const bulkIdsSchema = Joi.object({
  ids: Joi.array().items(Joi.number().integer().positive()).min(1).required()
});

const bulkStatusSchema = Joi.object({
  ids: Joi.array().items(Joi.number().integer().positive()).min(1).required(),
  status: Joi.string().allow('').required()
});

module.exports = {
  // Make schemas
  getAllMakesSchema,
  createMakeSchema,
  updateMakeSchema,
  
  // Category schemas
  getAllCategoriesSchema,
  createCategorySchema,
  updateCategorySchema,
  
  // Product schemas (merged)
  getAllProductsSchema,
  createProductSchema,
  updateProductSchema,
  
  // Common schemas
  bulkIdsSchema,
  bulkStatusSchema
};