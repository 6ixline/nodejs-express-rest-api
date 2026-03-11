const { Op } = require('sequelize');
const { Make, Admin } = require('../models');
const logger = require('../config/logger');

/**
 * Create a new make
 */
const createMake = async (title, slug, status, createdBy) => {
  try {
    const existingMake = await Make.findOne({ where: { slug } });
    if (existingMake) {
      throw new Error('Make with this slug already exists');
    }

    const make = await Make.create({
      title,
      slug,
      status: status || 'active',
      created_by: createdBy,
      updated_by: createdBy
    });

    logger.info(`Make created: ${title} by admin ${createdBy}`);
    return make;
  } catch (err) {
    logger.error(`Error creating make: ${err.message}`);
    throw err;
  }
};

/**
 * Get all makes with pagination and search
 */
const getAllMakes = async ({ page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'DESC' }) => {
  try {
    const offset = (page - 1) * limit;

    const whereClause = search
      ? {
          [Op.or]: [
            { title: { [Op.like]: `%${search}%` } },
            { slug: { [Op.like]: `%${search}%` } }
          ]
        }
      : {};

    const { count, rows } = await Make.findAndCountAll({
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
    logger.error(`Error fetching makes: ${err.message}`);
    throw err;
  }
};

/**
 * Get make by ID
 */
const getMakeById = async (id) => {
  try {
    const make = await Make.findByPk(id, {
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

    if (!make) {
      throw new Error('Make not found');
    }

    return make;
  } catch (err) {
    logger.error(`Error fetching make: ${err.message}`);
    throw err;
  }
};

/**
 * Update make
 */
const updateMake = async (id, title, slug, status, updatedBy) => {
  try {
    const make = await Make.findByPk(id);

    if (!make) {
      throw new Error('Make not found');
    }

    // Check if slug is being changed and if it already exists
    if (slug && slug !== make.slug) {
      const existingMake = await Make.findOne({ 
        where: { 
          slug,
          id: { [Op.ne]: id }
        } 
      });
      if (existingMake) {
        throw new Error('Make with this slug already exists');
      }
    }

    make.title = title || make.title;
    make.slug = slug || make.slug;
    make.status = status || make.status;
    make.updated_by = updatedBy;

    await make.save();

    logger.info(`Make updated: ${id} by admin ${updatedBy}`);
    return make;
  } catch (err) {
    logger.error(`Error updating make: ${err.message}`);
    throw err;
  }
};

/**
 * Delete make
 */
const deleteMake = async (id) => {
  try {
    const make = await Make.findByPk(id);

    if (!make) {
      throw new Error('Make not found');
    }

    await make.destroy();

    logger.info(`Make deleted: ${id}`);
    return make;
  } catch (err) {
    logger.error(`Error deleting make: ${err.message}`);
    throw err;
  }
};

/**
 * Bulk delete makes
 */
const bulkDeleteMakes = async (ids) => {
  try {
    const deletedCount = await Make.destroy({
      where: {
        id: {
          [Op.in]: ids
        }
      }
    });

    logger.info(`${deletedCount} makes deleted`);
    return deletedCount;
  } catch (err) {
    logger.error(`Error bulk deleting makes: ${err.message}`);
    throw err;
  }
};

/**
 * Bulk update make status
 */
const bulkUpdateMakeStatus = async (ids, status) => {
  try {
    const [updatedCount] = await Make.update(
      { status },
      { where: { id: ids } }
    );

    logger.info(`${updatedCount} makes status updated to ${status}`);
    return updatedCount;
  } catch (err) {
    logger.error(`Error bulk updating makes: ${err.message}`);
    throw err;
  }
};

/**
 * Get all active makes (for dropdowns)
 */
const getActiveMakes = async () => {
  try {
    const makes = await Make.findAll({
      where: { status: 'active' },
      attributes: ['id', 'title', 'slug'],
      order: [['title', 'ASC']]
    });

    return makes;
  } catch (err) {
    logger.error(`Error fetching active makes: ${err.message}`);
    throw err;
  }
};

module.exports = {
  createMake,
  getAllMakes,
  getMakeById,
  updateMake,
  deleteMake,
  bulkDeleteMakes,
  bulkUpdateMakeStatus,
  getActiveMakes
};