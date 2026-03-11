const { Op } = require('sequelize');
const { FavoriteProduct, Product, Make, Category, Files } = require('../models');
const logger = require('../config/logger');

/**
 * Add product to favorites
 */
const addToFavorites = async (userId, productId) => {
  try {
    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check if already in favorites
    const existingFavorite = await FavoriteProduct.findOne({
      where: {
        user_id: userId,
        product_id: productId
      }
    });

    if (existingFavorite) {
      throw new Error('Product already in favorites');
    }

    // Create favorite
    const favorite = await FavoriteProduct.create({
      user_id: userId,
      product_id: productId
    });

    logger.info(`Product ${productId} added to favorites by user ${userId}`);
    return favorite;
  } catch (err) {
    logger.error(`Error adding to favorites: ${err.message}`);
    throw err;
  }
};

/**
 * Get all favorite products for a user with pagination and search
 */
const getAllFavorites = async (userId, { page = 1, limit = 10, search = '', makeId, categoryId, status, sortBy = 'createdAt', order = 'DESC' }) => {
  try {
    const offset = (page - 1) * limit;

    const whereClause = { user_id: userId };
    const productWhereClause = {};
    let hasProductFilters = false;

    // Build search conditions - search in product fields only
    if (search) {
      productWhereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { product_code: { [Op.like]: `%${search}%` } },
        { ref_code: { [Op.like]: `%${search}%` } }
      ];
      hasProductFilters = true;
    }

    if (status) {
      let statusValues;
      if (Array.isArray(status)) {
        statusValues = status;
      } else if (typeof status === 'string' && status.includes(',')) {
        statusValues = status.split(',').map(s => s.trim());
      } else {
        statusValues = [status];
      }
      productWhereClause.status = { [Op.in]: statusValues };
      hasProductFilters = true;
    }

    if (makeId) {
      productWhereClause.make_id = makeId;
      hasProductFilters = true;
    }
    
    if (categoryId) {
      productWhereClause.category_id = categoryId;
      hasProductFilters = true;
    }

    // Build the product include configuration
    const productInclude = {
      model: Product,
      as: 'product',
      required: true, // Always true to ensure product exists
      include: [
        {
          model: Make,
          as: 'make',
          attributes: ['id', 'title', 'slug'],
          required: true
        },
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'title', 'slug'],
          required: true
        }
      ]
    };

    // Only add where clause if we have filters
    if (hasProductFilters) {
      productInclude.where = productWhereClause;
    }

    const { count, rows } = await FavoriteProduct.findAndCountAll({
      where: whereClause,
      include: [productInclude],
      order: [[sortBy, order]],
      offset,
      limit: parseInt(limit),
      distinct: true
    });

    // If no results found, return empty
    if (rows.length === 0) {
      return {
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0,
          totalItems: 0
        }
      };
    }

    // Filter out any favorites with null products (safety check)
    const validRows = rows.filter(f => f.product && f.product.id);
    
    if (validRows.length === 0) {
      return {
        data: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: 0,
          totalItems: 0
        }
      };
    }

    // Fetch images for all favorite products
    const productIds = validRows.map(f => f.product.id);
    const images = await Files.findAll({
      where: {
        owner_id: productIds,
        owner_type: 'product',
        type: 'product_image',
        status: 'active'
      },
      attributes: ['owner_id', 'id', 'url'],
      order: [['createdAt', 'ASC']],
      raw: true
    });

    const imageMap = new Map();
    images.forEach(img => {
      if (!imageMap.has(img.owner_id)) {
        imageMap.set(img.owner_id, img.url);
      }
    });

    // Format favorites data
    const favoritesData = validRows.map(favorite => {
      const favoriteData = favorite.toJSON();
      favoriteData.product.thumbnail = imageMap.get(favorite.product.id) || null;
      favoriteData.product.isFavorite = true;
      return favoriteData;
    });

    return {
      data: favoritesData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
        totalItems: count
      }
    };
  } catch (err) {
    logger.error(`Error fetching favorites: ${err.message}`);
    throw err;
  }
};

/**
 * Remove product from favorites
 */
const removeFromFavorites = async (userId, productId) => {
  try {
    const favorite = await FavoriteProduct.findOne({
      where: {
        user_id: userId,
        product_id: productId
      }
    });

    if (!favorite) {
      throw new Error('Favorite not found');
    }

    await favorite.destroy();

    logger.info(`Product ${productId} removed from favorites by user ${userId}`);
    return favorite;
  } catch (err) {
    logger.error(`Error removing from favorites: ${err.message}`);
    throw err;
  }
};

/**
 * Check if product is in favorites
 */
const isFavorite = async (userId, productId) => {
  try {
    const favorite = await FavoriteProduct.findOne({
      where: {
        user_id: userId,
        product_id: productId
      }
    });

    return !!favorite;
  } catch (err) {
    logger.error(`Error checking favorite: ${err.message}`);
    throw err;
  }
};

/**
 * Get favorite count for user
 */
const getFavoriteCount = async (userId) => {
  try {
    const count = await FavoriteProduct.count({
      where: { user_id: userId }
    });

    return count;
  } catch (err) {
    logger.error(`Error getting favorite count: ${err.message}`);
    throw err;
  }
};

/**
 * Bulk remove from favorites
 */
const bulkRemoveFromFavorites = async (userId, productIds) => {
  try {
    const deletedCount = await FavoriteProduct.destroy({
      where: {
        user_id: userId,
        product_id: productIds
      }
    });

    logger.info(`${deletedCount} products removed from favorites by user ${userId}`);
    return deletedCount;
  } catch (err) {
    logger.error(`Error bulk removing from favorites: ${err.message}`);
    throw err;
  }
};

module.exports = {
  addToFavorites,
  getAllFavorites,
  removeFromFavorites,
  isFavorite,
  getFavoriteCount,
  bulkRemoveFromFavorites
};