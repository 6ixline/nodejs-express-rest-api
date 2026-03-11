const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const { errorResponse } = require('../utils/apiResponse');

// Middleware to ensure that the user is an admin
const isAdmin = (req, res, next) => {
  // Get token from cookie named 'token'
  let token = req.cookies?.admin_token;

  // If no token in cookie, try Authorization header
  if (!token) {
    const authHeader = req.header('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    }
  }

  if (!token) {
    return errorResponse(res, 401, 'No token provided, access denied');
  }

  try {
    // Verify token using your JWT secret
    const decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET);

    // Check for admin role
    if (decoded.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied. Admins only');
    }

    req.user = decoded;  // Attach user data to the request

    // Continue to next middleware or controller
    next();
  } catch (err) {
    logger.error(`Error verifying admin token: ${err.message}`);
    return errorResponse(res, 401, 'Invalid or expired token');
  }
};

module.exports = isAdmin;
