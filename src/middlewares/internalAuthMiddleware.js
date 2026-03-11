const { verifyUserAccessToken } = require('../config/jwt');
const { errorResponse } = require('../utils/apiResponse');
const logger = require('../config/logger');

/**
 * Middleware for internal web platform users (role: internal)
 * 
 * Checks both the token cookie name and the role claim inside the token.
 * A normal mobile user who somehow gets an internal_token cookie will still
 * be rejected at the role check.
 */
const isInternalUser = (req, res, next) => {
  try {
    // Support both cookie (web) and Authorization header (API clients / testing)
    const token =
      req.cookies?.internal_token ||
      req.headers?.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = verifyUserAccessToken(token);

    // Hard role check - this is the key guard that keeps mobile users out
    if (decoded.role !== 'internal') {
      logger.warn(`Access denied: user ID ${decoded.id} with role '${decoded.role}' attempted to access internal route`);
      return res.status(403).json({ message: 'Access denied. Internal users only.' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    logger.error(`Internal auth middleware error: ${err.message}`);
    return errorResponse(res, 401, 'Unauthorized', err.message);
  }
};

module.exports = isInternalUser;