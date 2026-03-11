const { UserService } = require('../../services');
const { successResponse, errorResponse } = require('../../utils/apiResponse');
const logger = require('../../config/logger');
const { formatSequelizeErrors } = require('../../utils/validation');
const { getAllUsersSchema } = require('../../validators/admin');

// Get all users (for admin panel)
const getAllUsers = async (req, res) => {
  try {
    const { value, error } = getAllUsersSchema.validate(req.query, { convert: true });

    if (error) {
      return errorResponse(res, 400, "Invalid query parameters", error.details.map((d) => d.message));
    }

    const { page, limit, search, sortBy, order, role } = value;

    const result = await UserService.getAllUsers({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
      sortBy,
      order: order.toUpperCase(),
      role, // undefined = all users, 'normal' = dealers, 'internal' = web users
    });

    return successResponse(res, 200, "Users Fetched Successfully", result);
  } catch (err) {
    logger.error(`Error fetching users: ${err.message}`);
    return errorResponse(res, 500, "Error fetching users", err.message);
  }
};

// Get single user (for admin panel)
const getUser = async (req, res) => {
  const {id} = req.params;
  try {
    const users = await UserService.getUser(id);
    return successResponse(res, 200, "User Fetched Successfully", users);
  } catch (err) {
    logger.error(`Error fetching users: ${err.message}`);
    return errorResponse(res, 500, `Error fetching users`, err.message);
  }
};

// Delete single user
const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const users = await UserService.deleteUser(id);
    return successResponse(res, 200, "User Deleted Successfully", users);
  } catch (err) {
    logger.error(`Error deleting users: ${err.message}`);
    return errorResponse(res, 500, `Error deleting users`, err.message);
  }
};

// Bulk delete users
const bulkDeleteUser = async (req, res) => {
  const { ids } = req.body;
  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      return errorResponse(res, 500, 'Please Select Aleast one User', 'No IDs provided for deletion.');
    }
    const deleteCount = await UserService.bulkDeleteUser(ids);
    return successResponse(res, 200, `(${deleteCount}) Records Deleted Successfully`);
  } catch (err) {
    logger.error(`Error bulk deleting users: ${err.message}`);
    return errorResponse(res, 500, `Error deleting users`, err.message);
  }
};

// Update user - role is intentionally NOT accepted here to prevent
// accidental promotion/demotion between dealer and internal user
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, password, email, mobile, status, fileid, filesToDelete } = req.body;
  try {
    const user = await UserService.updateUser(id, name, password, email, mobile, status, fileid, filesToDelete);
    return successResponse(res, 200, `Records Updated Successfully`, user);
  } catch (err) {
    logger.error(`Error Updating users: ${err.message}`);
    let messages = formatSequelizeErrors(err);
    return errorResponse(res, 500, err.message, messages);
  }
};

// Create user - role comes from request body, service defaults to 'normal' if not provided
const createUser = async (req, res) => {
  const { name, password, email, mobile, status, fileid, filesToDelete, role = 'normal' } = req.body;
  try {
    const user = await UserService.createUser(name, password, email, mobile, status, fileid, filesToDelete, role);
    logger.info(`User ${email} created successfully`);
    return successResponse(res, 200, `User ${name} created successfully`, user);
  } catch (err) {
    let messages = formatSequelizeErrors(err);
    logger.error(`Error registering user: ${err.message}`);
    return errorResponse(res, 500, err.message, messages);
  }
};

// Bulk update user status
const bulkUserUpdate = async (req, res) => {
  const { ids, status } = req.body;
  try {
    const user = await UserService.bulkUserUpdate(ids, status);
    return successResponse(res, 200, `Records Updated Successfully`, user);
  } catch (err) {
    logger.error(`Error Updating users: ${err.message}`);
    let messages = formatSequelizeErrors(err);
    return errorResponse(res, 500, err.message, messages);
  }
};

module.exports = {
  bulkDeleteUser,
  bulkUserUpdate,
  createUser,
  deleteUser,
  getUser,
  getAllUsers,
  updateUser,
};