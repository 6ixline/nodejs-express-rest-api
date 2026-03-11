const { FavoriteProductService } = require('../services');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const logger = require('../config/logger');
const { getAllFavoritesSchema } = require('../validators/favoriteSchemas');

/**
 * Add product to favorites
 */
const addToFavorites = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.user.id;

    if (!productId || isNaN(productId)) {
      return errorResponse(res, 400, 'Valid product ID is required');
    }

    const favorite = await FavoriteProductService.addToFavorites(userId, productId);

    return successResponse(res, 201, 'Product added to favorites', favorite);
  } catch (err) {
    logger.error(`Add to favorites failed: ${err.message}`);
    
    if (err.message === 'Product not found') {
      return errorResponse(res, 404, err.message);
    }
    
    if (err.message === 'Product already in favorites') {
      return errorResponse(res, 409, err.message);
    }

    return errorResponse(res, 500, 'Failed to add to favorites', err.message);
  }
};

/**
 * Get all favorite products
 */
const getAllFavorites = async (req, res) => {
  try {
    const { error, value } = getAllFavoritesSchema.validate(req.query, {
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

    const userId = req.user.id;
    const result = await FavoriteProductService.getAllFavorites(userId, value);

    return successResponse(res, 200, 'Favorites fetched successfully', result);
  } catch (err) {
    logger.error(`Get favorites failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to fetch favorites', err.message);
  }
};

/**
 * Remove product from favorites
 */
const removeFromFavorites = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    if (!productId || isNaN(productId)) {
      return errorResponse(res, 400, 'Valid product ID is required');
    }

    const favorite = await FavoriteProductService.removeFromFavorites(userId, parseInt(productId));

    return successResponse(res, 200, 'Product removed from favorites', favorite);
  } catch (err) {
    logger.error(`Remove from favorites failed: ${err.message}`);
    
    if (err.message === 'Favorite not found') {
      return errorResponse(res, 404, err.message);
    }

    return errorResponse(res, 500, 'Failed to remove from favorites', err.message);
  }
};

/**
 * Check if product is favorite
 */
const checkIsFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    if (!productId || isNaN(productId)) {
      return errorResponse(res, 400, 'Valid product ID is required');
    }

    const isFavorite = await FavoriteProductService.isFavorite(userId, parseInt(productId));

    return successResponse(res, 200, 'Favorite status checked', { isFavorite });
  } catch (err) {
    logger.error(`Check favorite failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to check favorite status', err.message);
  }
};

/**
 * Get favorite count
 */
const getFavoriteCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await FavoriteProductService.getFavoriteCount(userId);

    return successResponse(res, 200, 'Favorite count fetched', { count });
  } catch (err) {
    logger.error(`Get favorite count failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to get favorite count', err.message);
  }
};

/**
 * Bulk remove from favorites
 */
const bulkRemoveFromFavorites = async (req, res) => {
  try {
    const { productIds } = req.body;
    const userId = req.user.id;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return errorResponse(res, 400, 'Product IDs array is required');
    }

    const deletedCount = await FavoriteProductService.bulkRemoveFromFavorites(userId, productIds);

    return successResponse(res, 200, `${deletedCount} products removed from favorites`, { deletedCount });
  } catch (err) {
    logger.error(`Bulk remove from favorites failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to bulk remove from favorites', err.message);
  }
};

module.exports = {
  addToFavorites,
  getAllFavorites,
  removeFromFavorites,
  checkIsFavorite,
  getFavoriteCount,
  bulkRemoveFromFavorites
};