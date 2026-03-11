const { Op } = require('sequelize');
const { Category, Admin } = require('../models');
const logger = require('../config/logger');

/**
 * Create a new category
 */
const createCategory = async (title, slug, description, status, createdBy) => {
  try {
    const existingCategory = await Category.findOne({ where: { slug } });
    if (existingCategory) {
      throw new Error('Category with this slug already exists');
    }

    const category = await Category.create({
      title,
      slug,
      description,
      status: status || 'active',
      created_by: createdBy,
      updated_by: createdBy
    });

    logger.info(`Category created: ${title} by admin ${createdBy}`);
    return category;
  } catch (err) {
    logger.error(`Error creating category: ${err.message}`);
    throw err;
  }
};

/**
 * Get all categories with pagination and search
 */
const getAllCategories = async ({ page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'DESC' }) => {
  try {
    const offset = (page - 1) * limit;

    const whereClause = search
      ? {
          [Op.or]: [
            { title: { [Op.like]: `%${search}%` } },
            { slug: { [Op.like]: `%${search}%` } },
            { description: { [Op.like]: `%${search}%` } }
          ]
        }
      : {};

    const { count, rows } = await Category.findAndCountAll({
      where: whereClause,
      order: [[sortBy, order]],
      include: [
        {
          model: Admin,
          as: 'creator',
          attributes: ['id', 'username', 'displayName']
        },
        {
          model: Admin,
          as: 'updater',
          attributes: ['id', 'username', 'displayName']
        }
      ],
      offset,
      limit: parseInt(limit)
    });

    return {
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
        totalItems: count
      }
    };
  } catch (err) {
    logger.error(`Error fetching categories: ${err.message}`);
    throw err;
  }
};

/**
 * Get category by ID
 */
const getCategoryById = async (id) => {
  try {
    const category = await Category.findByPk(id, {
      include: [
        {
          model: Admin,
          as: 'creator',
          attributes: ['id', 'username', 'displayName']
        },
        {
          model: Admin,
          as: 'updater',
          attributes: ['id', 'username', 'displayName']
        }
      ]
    });

    if (!category) {
      throw new Error('Category not found');
    }

    return category;
  } catch (err) {
    logger.error(`Error fetching category: ${err.message}`);
    throw err;
  }
};

/**
 * Update category
 */
const updateCategory = async (id, title, slug, description, status, updatedBy) => {
  try {
    const category = await Category.findByPk(id);

    if (!category) {
      throw new Error('Category not found');
    }

    // Check if slug is being changed and if it already exists
    if (slug && slug !== category.slug) {
      const existingCategory = await Category.findOne({ 
        where: { 
          slug,
          id: { [Op.ne]: id }
        } 
      });
      if (existingCategory) {
        throw new Error('Category with this slug already exists');
      }
    }

    category.title = title || category.title;
    category.slug = slug || category.slug;
    category.description = description !== undefined ? description : category.description;
    category.status = status || category.status;
    category.updated_by = updatedBy;

    await category.save();

    logger.info(`Category updated: ${id} by admin ${updatedBy}`);
    return category;
  } catch (err) {
    logger.error(`Error updating category: ${err.message}`);
    throw err;
  }
};

/**
 * Delete category
 */
const deleteCategory = async (id) => {
  try {
    const category = await Category.findByPk(id);

    if (!category) {
      throw new Error('Category not found');
    }

    await category.destroy();

    logger.info(`Category deleted: ${id}`);
    return category;
  } catch (err) {
    logger.error(`Error deleting category: ${err.message}`);
    throw err;
  }
};

/**
 * Bulk delete categories
 */
const bulkDeleteCategories = async (ids) => {
  try {
    const deletedCount = await Category.destroy({
      where: {
        id: {
          [Op.in]: ids
        }
      }
    });

    logger.info(`${deletedCount} categories deleted`);
    return deletedCount;
  } catch (err) {
    logger.error(`Error bulk deleting categories: ${err.message}`);
    throw err;
  }
};

/**
 * Bulk update category status
 */
const bulkUpdateCategoryStatus = async (ids, status) => {
  try {
    const [updatedCount] = await Category.update(
      { status },
      { where: { id: ids } }
    );

    logger.info(`${updatedCount} categories status updated to ${status}`);
    return updatedCount;
  } catch (err) {
    logger.error(`Error bulk updating categories: ${err.message}`);
    throw err;
  }
};

/**
 * Get all active categories (for dropdowns)
 */
const getActiveCategories = async () => {
  try {
    const categories = await Category.findAll({
      where: { status: 'active' },
      attributes: ['id', 'title', 'slug'],
      order: [['title', 'ASC']]
    });

    return categories;
  } catch (err) {
    logger.error(`Error fetching active categories: ${err.message}`);
    throw err;
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  bulkDeleteCategories,
  bulkUpdateCategoryStatus,
  getActiveCategories
};