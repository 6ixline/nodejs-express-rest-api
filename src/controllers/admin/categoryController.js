const CategoryService = require('../../services/categoryService');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const logger = require('../../config/logger');

const createCategory = async (req, res) => {
  try {
    const { title, slug, description, status } = req.body;
    const createdBy = req.user.id;

    const category = await CategoryService.createCategory(title, slug, description, status, createdBy);

    return successResponse(res, 201, 'Category created successfully', category);
  } catch (err) {
    logger.error(`Create category failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to create category', err.message);
  }
};

const getAllCategories = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'DESC' } = req.query;

    const result = await CategoryService.getAllCategories({ page, limit, search, sortBy, order });

    return successResponse(res, 200, 'Categories fetched successfully', result);
  } catch (err) {
    logger.error(`Get categories failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to fetch categories', err.message);
  }
};

const getActiveCategories = async (req, res) => {
  try {
    const categories = await CategoryService.getActiveCategories();

    return successResponse(res, 200, 'Active categories fetched successfully', categories);
  } catch (err) {
    logger.error(`Get active categories failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to fetch active categories', err.message);
  }
};

const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await CategoryService.getCategoryById(id);

    return successResponse(res, 200, 'Category fetched successfully', category);
  } catch (err) {
    logger.error(`Get category failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to fetch category', err.message);
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, slug, description, status } = req.body;
    const updatedBy = req.user.id;

    const category = await CategoryService.updateCategory(id, title, slug, description, status, updatedBy);

    return successResponse(res, 200, 'Category updated successfully', category);
  } catch (err) {
    logger.error(`Update category failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to update category', err.message);
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await CategoryService.deleteCategory(id);

    return successResponse(res, 200, 'Category deleted successfully', category);
  } catch (err) {
    logger.error(`Delete category failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to delete category', err.message);
  }
};

const bulkDeleteCategories = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return errorResponse(res, 400, 'IDs array is required');
    }

    const deletedCount = await CategoryService.bulkDeleteCategories(ids);

    return successResponse(res, 200, `${deletedCount} categories deleted successfully`, { deletedCount });
  } catch (err) {
    logger.error(`Bulk delete categories failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to bulk delete categories', err.message);
  }
};

const bulkUpdateCategoryStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return errorResponse(res, 400, 'IDs array is required');
    }

    if (!status) {
      return errorResponse(res, 400, 'Status is required');
    }

    const updatedCount = await CategoryService.bulkUpdateCategoryStatus(ids, status);

    return successResponse(res, 200, `${updatedCount} categories status updated successfully`, { updatedCount });
  } catch (err) {
    logger.error(`Bulk update categories failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to bulk update categories', err.message);
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getActiveCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  bulkDeleteCategories,
  bulkUpdateCategoryStatus
};