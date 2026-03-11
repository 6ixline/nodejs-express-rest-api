const express = require('express');
const router = express.Router();
const FavoriteProductController = require('../controllers/favoriteProductController');
const isAuthenticated = require('../middlewares/authMiddleware');

// All routes require authentication
router.use(isAuthenticated);

/**
 * @route   POST /api/favorites
 * @desc    Add product to favorites
 * @access  Private (User)
 */
router.post('/', FavoriteProductController.addToFavorites);

/**
 * @route   GET /api/favorites
 * @desc    Get all favorite products with pagination and search
 * @access  Private (User)
 */
router.get('/', FavoriteProductController.getAllFavorites);

/**
 * @route   DELETE /api/favorites/:productId
 * @desc    Remove product from favorites
 * @access  Private (User)
 */
router.delete('/:productId', FavoriteProductController.removeFromFavorites);

/**
 * @route   GET /api/favorites/check/:productId
 * @desc    Check if product is in favorites
 * @access  Private (User)
 */
router.get('/check/:productId', FavoriteProductController.checkIsFavorite);

/**
 * @route   GET /api/favorites/count
 * @desc    Get total favorite count for user
 * @access  Private (User)
 */
router.get('/count', FavoriteProductController.getFavoriteCount);

/**
 * @route   POST /api/favorites/bulk-remove
 * @desc    Remove multiple products from favorites
 * @access  Private (User)
 */
router.post('/bulk-remove', FavoriteProductController.bulkRemoveFromFavorites);

module.exports = router;