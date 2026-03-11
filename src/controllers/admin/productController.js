const { ProductService } = require('../../services');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const logger = require('../../config/logger');
const {
  createProductSchema,
  updateProductSchema,
  getAllProductsSchema
} = require('../../validators/productSchemas');

/**
 * Create product
 */
const createProduct = async (req, res) => {
  try {
    const { error, value } = createProductSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return errorResponse(res, 400, 'Validation failed', errors);
    }

    const { productData, imageIds } = value;
    const createdBy = req.user.id;

    const product = await ProductService.createProduct(productData, imageIds, createdBy);

    return successResponse(res, 201, 'Product created successfully', product);
  } catch (err) {
    logger.error(`Create product failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to create product', err.message);
  }
};

/**
 * Get all products
 */
const getAllProducts = async (req, res) => {
  try {
    const { error, value } = getAllProductsSchema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return errorResponse(res, 400, 'Validation failed', errors);
    }

    const result = await ProductService.getAllProducts(value);

    return successResponse(res, 200, 'Products fetched successfully', result);
  } catch (err) {
    logger.error(`Get products failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to fetch products', err.message);
  }
};

/**
 * Get product by ID
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return errorResponse(res, 400, 'Invalid product ID');
    }

    const product = await ProductService.getProductById(id);

    return successResponse(res, 200, 'Product fetched successfully', product);
  } catch (err) {
    logger.error(`Get product failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to fetch product', err.message);
  }
};

/**
 * Update product
 */
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return errorResponse(res, 400, 'Invalid product ID');
    }

    const { error, value } = updateProductSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return errorResponse(res, 400, 'Validation failed', errors);
    }

    const { productData, imageIds, imagesToDelete } = value;
    const updatedBy = req.user.id;

    const product = await ProductService.updateProduct(id, productData || {}, imageIds, imagesToDelete, updatedBy);

    return successResponse(res, 200, 'Product updated successfully', product);
  } catch (err) {
    logger.error(`Update product failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to update product', err.message);
  }
};

/**
 * Delete product
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return errorResponse(res, 400, 'Invalid product ID');
    }

    const product = await ProductService.deleteProduct(id);

    return successResponse(res, 200, 'Product deleted successfully', product);
  } catch (err) {
    logger.error(`Delete product failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to delete product', err.message);
  }
};

/**
 * Bulk delete products
 */
const bulkDeleteProducts = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return errorResponse(res, 400, 'IDs array is required');
    }

    const deletedCount = await ProductService.bulkDeleteProducts(ids);

    return successResponse(res, 200, `${deletedCount} products deleted successfully`, { deletedCount });
  } catch (err) {
    logger.error(`Bulk delete products failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to bulk delete products', err.message);
  }
};

/**
 * Bulk update product status
 */
const bulkUpdateProductStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return errorResponse(res, 400, 'IDs array is required');
    }

    if (!status) {
      return errorResponse(res, 400, 'Status is required');
    }

    const updatedCount = await ProductService.bulkUpdateProductStatus(ids, status);

    return successResponse(res, 200, `${updatedCount} products status updated successfully`, { updatedCount });
  } catch (err) {
    logger.error(`Bulk update products failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to bulk update products', err.message);
  }
};

/**
 * Get products by reference code
 */
const getProductsByRefCode = async (req, res) => {
  try {
    const { refCode } = req.params;

    if (!refCode) {
      return errorResponse(res, 400, 'Reference code is required');
    }

    const products = await ProductService.getProductsByRefCode(refCode);

    return successResponse(res, 200, 'Related products fetched successfully', products);
  } catch (err) {
    logger.error(`Get products by ref code failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to fetch related products', err.message);
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  bulkUpdateProductStatus,
  getProductsByRefCode
};