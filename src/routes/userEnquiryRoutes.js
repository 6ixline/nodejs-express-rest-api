const express = require('express');
const router = express.Router();
const UserEnquiryController = require('../controllers/userEnquiryController');
const isAuthenticated = require('../middlewares/authMiddleware');

// All routes require user authentication
router.use(isAuthenticated);

/**
 * @route   POST /api/enquiries
 * @desc    Create a new enquiry
 * @access  Private (User)
 */
router.post('/', UserEnquiryController.createEnquiry);

/**
 * @route   GET /api/enquiries
 * @desc    Get all enquiries for logged-in user
 * @access  Private (User)
 */
router.get('/', UserEnquiryController.getUserEnquiries);

/**
 * @route   GET /api/enquiries/:enquiryId
 * @desc    Get single enquiry details
 * @access  Private (User)
 */
router.get('/:enquiryId', UserEnquiryController.getUserEnquiryById);

module.exports = router;