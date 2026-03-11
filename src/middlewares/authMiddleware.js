const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const { errorResponse } = require('../utils/apiResponse');

const isAuthenticated = (req, res, next) => {
  // Get the token from the 'user_token' cookie
  let token = req.cookies?.user_token;

  // Fallback to Authorization header if cookie is not present
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
    // Use the user-specific JWT secret here
    const decoded = jwt.verify(token, process.env.JWT_USER_SECRET);

    req.user = decoded;  // Attach user data to the request

    next();
  } catch (err) {
    logger.error(`Error verifying authentication token: ${err.message}`);
    return errorResponse(res, 401, 'Invalid or expired token');
  }
};

module.exports = isAuthenticated;
