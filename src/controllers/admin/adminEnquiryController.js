const { EnquiryService } = require('../../services');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const logger = require('../../config/logger');
const { getAllEnquiriesSchema, updateEnquirySchema } = require('../../validators/enquirySchemas');

/**
 * Admin: Get all enquiries with filters
 */
const getAllEnquiries = async (req, res) => {
  try {
    const { error, value } = getAllEnquiriesSchema.validate(req.query, {
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

    const result = await EnquiryService.getAllEnquiries(value);

    return successResponse(res, 200, 'Enquiries fetched successfully', result);
  } catch (err) {
    logger.error(`Get all enquiries failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to fetch enquiries', err.message);
  }
};

/**
 * Admin: Get single enquiry by ID
 */
const getEnquiryById = async (req, res) => {
  try {
    const { enquiryId } = req.params;

    if (!enquiryId || isNaN(enquiryId)) {
      return errorResponse(res, 400, 'Valid enquiry ID is required');
    }

    const enquiry = await EnquiryService.getEnquiryById(parseInt(enquiryId));

    return successResponse(res, 200, 'Enquiry fetched successfully', enquiry);
  } catch (err) {
    logger.error(`Get enquiry failed: ${err.message}`);
    
    if (err.message === 'Enquiry not found') {
      return errorResponse(res, 404, err.message);
    }

    return errorResponse(res, 500, 'Failed to fetch enquiry', err.message);
  }
};

/**
 * Admin: Update enquiry (status, priority, remarks, etc.)
 */
const updateEnquiry = async (req, res) => {
  try {
    const { enquiryId } = req.params;

    if (!enquiryId || isNaN(enquiryId)) {
      return errorResponse(res, 400, 'Valid enquiry ID is required');
    }

    const { error, value } = updateEnquirySchema.validate(req.body, {
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

    const adminId = req.user.id;
    const enquiry = await EnquiryService.updateEnquiry(parseInt(enquiryId), adminId, value);

    return successResponse(res, 200, 'Enquiry updated successfully', enquiry);
  } catch (err) {
    logger.error(`Update enquiry failed: ${err.message}`);
    
    if (err.message === 'Enquiry not found') {
      return errorResponse(res, 404, err.message);
    }

    if (err.message === 'Admin not found') {
      return errorResponse(res, 404, err.message);
    }

    return errorResponse(res, 500, 'Failed to update enquiry', err.message);
  }
};

/**
 * Admin: Delete enquiry
 */
const deleteEnquiry = async (req, res) => {
  try {
    const { enquiryId } = req.params;

    if (!enquiryId || isNaN(enquiryId)) {
      return errorResponse(res, 400, 'Valid enquiry ID is required');
    }

    await EnquiryService.deleteEnquiry(parseInt(enquiryId));

    return successResponse(res, 200, 'Enquiry deleted successfully');
  } catch (err) {
    logger.error(`Delete enquiry failed: ${err.message}`);
    
    if (err.message === 'Enquiry not found') {
      return errorResponse(res, 404, err.message);
    }

    return errorResponse(res, 500, 'Failed to delete enquiry', err.message);
  }
};

/**
 * Admin: Get enquiry statistics
 */
const getEnquiryStats = async (req, res) => {
  try {
    const stats = await EnquiryService.getEnquiryStats();

    return successResponse(res, 200, 'Statistics fetched successfully', stats);
  } catch (err) {
    logger.error(`Get enquiry stats failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to fetch statistics', err.message);
  }
};

const bulkDeleteEnquiry = async (req, res) => {
  const { ids } = req.body;
  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      return errorResponse(res, 500, 'Please Select Aleast one Enquiry', 'No IDs provided for deletion.');
    }
    // Delegate to the service layer
    const deleteCount = await EnquiryService.bulkDeleteEnquiry(ids);
    
    return successResponse(res, 200, `(${deleteCount}) Records Deleted Successfully`);
  } catch (err) {
    logger.error(`Error bulk deleting enquiries: ${err.message}`);
    return errorResponse(res, 500, `Error deleting enquiries`, err.message);
  }
};

module.exports = {
  getAllEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
  getEnquiryStats,
  bulkDeleteEnquiry
};