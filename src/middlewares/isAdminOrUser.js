const jwt = require('jsonwebtoken');
const logger = require('../config/logger');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Middleware to check if the user is either an admin or a registered user
 * Accepts tokens from both admin_token and user_token cookies or Authorization header
 */
const isAdminOrUser = (req, res, next) => {
  let token = null;
  let tokenType = null;

  // Try to get admin token first
  if (req.cookies?.admin_token) {
    token = req.cookies.admin_token;
    tokenType = 'admin';
  } 
  // Try to get user token
  else if (req.cookies?.user_token) {
    token = req.cookies.user_token;
    tokenType = 'user';
  }
  // Try to get user token
  else if (req.cookies?.internal_token) {
    token = req.cookies.internal_token;
    tokenType = 'user';
  }
  // Fallback to Authorization header
  else {
    const authHeader = req.header('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
      tokenType = 'unknown';
    }
  }

  if (!token) {
    return errorResponse(res, 401, 'No token provided, access denied');
  }

  try {
    let decoded = null;

    // If token type is known, verify with the appropriate secret
    if (tokenType === 'admin') {
      decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET);
    } else if (tokenType === 'user') {
      decoded = jwt.verify(token, process.env.JWT_USER_SECRET);
    } else {
      // Token type unknown (from Authorization header), try both secrets
      try {
        decoded = jwt.verify(token, process.env.JWT_ADMIN_SECRET);
        tokenType = 'admin';
      } catch (adminErr) {
        try {
          decoded = jwt.verify(token, process.env.JWT_USER_SECRET);
          tokenType = 'user';
        } catch (userErr) {
          throw new Error('Token verification failed with both secrets');
        }
      }
    }

    // Attach user data to the request
    req.user = decoded;
    req.userType = tokenType; 

    // Continue to next middleware or controller
    next();
  } catch (err) {
    logger.error(`Error verifying token in isAdminOrUser: ${err.message}`);
    return errorResponse(res, 401, 'Invalid or expired token');
  }
};

module.exports = isAdminOrUser;