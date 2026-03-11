const MakeService = require('../../services/makeService');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const logger = require('../../config/logger');
const {
  createMakeSchema,
  updateMakeSchema,
  getAllMakesSchema,
  bulkIdsSchema,
  bulkStatusSchema
} = require('../../validators/productSchemas');

const createMake = async (req, res) => {
  try {
    const { error, value } = createMakeSchema.validate(req.body, {
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

    const { title, slug, status } = value;
    const createdBy = req.user.id;

    const make = await MakeService.createMake(title, slug, status, createdBy);

    return successResponse(res, 201, 'Make created successfully', make);
  } catch (err) {
    logger.error(`Create make failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to create make', err.message);
  }
};

const getAllMakes = async (req, res) => {
  try {
    const { error, value } = getAllMakesSchema.validate(req.query, {
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

    const result = await MakeService.getAllMakes(value);

    return successResponse(res, 200, 'Makes fetched successfully', result);
  } catch (err) {
    logger.error(`Get makes failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to fetch makes', err.message);
  }
};

const getActiveMakes = async (req, res) => {
  try {
    const makes = await MakeService.getActiveMakes();

    return successResponse(res, 200, 'Active makes fetched successfully', makes);
  } catch (err) {
    logger.error(`Get active makes failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to fetch active makes', err.message);
  }
};

const getMakeById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return errorResponse(res, 400, 'Invalid make ID');
    }

    const make = await MakeService.getMakeById(id);

    return successResponse(res, 200, 'Make fetched successfully', make);
  } catch (err) {
    logger.error(`Get make failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to fetch make', err.message);
  }
};

const updateMake = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return errorResponse(res, 400, 'Invalid make ID');
    }

    const { error, value } = updateMakeSchema.validate(req.body, {
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

    const { title, slug, status } = value;
    const updatedBy = req.user.id;

    const make = await MakeService.updateMake(id, title, slug, status, updatedBy);

    return successResponse(res, 200, 'Make updated successfully', make);
  } catch (err) {
    logger.error(`Update make failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to update make', err.message);
  }
};

const deleteMake = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(id)) {
      return errorResponse(res, 400, 'Invalid make ID');
    }

    const make = await MakeService.deleteMake(id);

    return successResponse(res, 200, 'Make deleted successfully', make);
  } catch (err) {
    logger.error(`Delete make failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to delete make', err.message);
  }
};

const bulkDeleteMakes = async (req, res) => {
  try {
    const { error, value } = bulkIdsSchema.validate(req.body, {
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

    const { ids } = value;
    const deletedCount = await MakeService.bulkDeleteMakes(ids);

    return successResponse(res, 200, `${deletedCount} makes deleted successfully`, { deletedCount });
  } catch (err) {
    logger.error(`Bulk delete makes failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to bulk delete makes', err.message);
  }
};

const bulkUpdateMakeStatus = async (req, res) => {
  try {
    const { error, value } = bulkStatusSchema.validate(req.body, {
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

    const { ids, status } = value;
    const updatedCount = await MakeService.bulkUpdateMakeStatus(ids, status);

    return successResponse(res, 200, `${updatedCount} makes status updated successfully`, { updatedCount });
  } catch (err) {
    logger.error(`Bulk update makes failed: ${err.message}`);
    return errorResponse(res, 500, 'Failed to bulk update makes', err.message);
  }
};

module.exports = {
  createMake,
  getAllMakes,
  getActiveMakes,
  getMakeById,
  updateMake,
  deleteMake,
  bulkDeleteMakes,
  bulkUpdateMakeStatus
};