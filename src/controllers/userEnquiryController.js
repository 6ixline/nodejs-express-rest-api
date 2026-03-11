const { EnquiryService } = require('../services');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const logger = require('../config/logger');
const { createEnquirySchema, getUserEnquiriesSchema } = require('../validators/enquirySchemas');

/**
 * User: Create a new enquiry
 */
const createEnquiry = async (req, res) => {
  try {
    const { error, value } = createEnquirySchema.validate(req.body, {
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
    const enquiry = await EnquiryService.createEnquiry(userId, value);

    return successResponse(res, 201, 'Enquiry submitted successfully', enquiry);
  } catch (err) {
    logger.error(`Create enquiry failed: ${err.message}`);
    
    if (err.message === 'Product not found') {
      return errorResponse(res, 404, err.message);
    }

    return errorResponse(res, 500, 'Failed to create enquiry', err.message);
  }
};

/**
 * User: Get all enquiries for logged-in user
 */
const getUserEnquiries = async (req, res) => {
  try {
    const { error, value } = getUserEnquiriesSchema.validate(req.query, {
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
    const result = await EnquiryService.getUserEnquiries(userId, value);

    return successResponse(res, 200, 'Enquiries fetched successfully', result);
  } catch (err) {
    logger.error(`Get user enquiries failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to fetch enquiries', err.message);
  }
};

/**
 * User: Get single enquiry details
 */
const getUserEnquiryById = async (req, res) => {
  try {
    const { enquiryId } = req.params;
    const userId = req.user.id;

    if (!enquiryId || isNaN(enquiryId)) {
      return errorResponse(res, 400, 'Valid enquiry ID is required');
    }

    const enquiry = await EnquiryService.getUserEnquiryById(userId, parseInt(enquiryId));

    return successResponse(res, 200, 'Enquiry fetched successfully', enquiry);
  } catch (err) {
    logger.error(`Get enquiry failed: ${err.message}`);
    
    if (err.message === 'Enquiry not found') {
      return errorResponse(res, 404, err.message);
    }

    return errorResponse(res, 500, 'Failed to fetch enquiry', err.message);
  }
};

module.exports = {
  createEnquiry,
  getUserEnquiries,
  getUserEnquiryById
};