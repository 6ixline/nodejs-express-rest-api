const express = require('express');
const router = express.Router();
const AdminEnquiryController = require('../../controllers/admin/adminEnquiryController');
const isAdmin = require('../../middlewares/adminMiddleware');

// All routes require admin authentication
router.use(isAdmin);

/**
 * @route   GET /api/admin/enquiry/stats
 * @desc    Get enquiry statistics
 * @access  Private (Admin)
 */
router.get('/stats', AdminEnquiryController.getEnquiryStats);

/**
 * @route   GET /api/admin/enquiry
 * @desc    Get all enquiries with filters
 * @access  Private (Admin)
 */
router.get('/', AdminEnquiryController.getAllEnquiries);

/**
 * @route   GET /api/admin/enquiry/:enquiryId
 * @desc    Get single enquiry by ID
 * @access  Private (Admin)
 */
router.get('/:enquiryId', AdminEnquiryController.getEnquiryById);

/**
 * @route   PUT /api/admin/enquiry/:enquiryId
 * @desc    Update enquiry (status, priority, remarks, etc.)
 * @access  Private (Admin)
 */
router.put('/:enquiryId', AdminEnquiryController.updateEnquiry);

/**
 * @route   DELETE /api/admin/enquiry
 * @desc    Bulk Delete enquiry
 * @access  Private (Admin)
 */
router.delete('/bulk', AdminEnquiryController.bulkDeleteEnquiry);

/**
 * @route   DELETE /api/admin/enquiry/:enquiryId
 * @desc    Delete enquiry
 * @access  Private (Admin)
 */
router.delete('/:enquiryId', AdminEnquiryController.deleteEnquiry);


module.exports = router;
